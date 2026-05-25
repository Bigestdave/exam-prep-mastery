import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOKENROUTER_GATEWAY = "https://api.tokenrouter.com/v1/chat/completions";
const MODEL_GPT4O_MINI = "openai/gpt-4o-mini";
const MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4.6";
const QUESTION_BATCH_SIZE = 2;

interface GeneratePayload {
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  raw_text?: string;
  pdf_urls?: string[];
}

interface ExtractedQuestions {
  questions: string[];
}

interface GeneratedQuiz {
  question: string;
  options: string[];
  correct_index: number;
  explanation_text?: string;
  hint_text?: string;
}

interface GeneratedAnswer {
  answer_text: string;
  explanation_text: string;
  key_points: string[];
  exam_tip: string;
  answer_confidence: number;
  quizzes: GeneratedQuiz[];
}

function getUserIdFromToken(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

function extractJsonString(text: string, anchor: string): string | null {
  const start = text.indexOf(anchor);
  if (start === -1) return null;

  let depth = 0;
  let started = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      depth += 1;
      started = true;
    } else if (char === "}") {
      depth -= 1;
      if (started && depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseJsonObject<T>(text: string, anchor: string): T | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const jsonString = extractJsonString(cleaned, anchor);
  if (!jsonString) return null;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", error, cleaned.slice(0, 500));
    return null;
  }
}

function normalizeQuestions(rawQuestions: unknown): string[] {
  if (!Array.isArray(rawQuestions)) return [];

  return Array.from(
    new Set(
      rawQuestions
        .map((question) => String(question ?? "").replace(/\s+/g, " ").trim())
        .filter((question) => question.length > 8),
    ),
  );
}

function normalizeQuiz(quiz: unknown): GeneratedQuiz | null {
  if (!quiz || typeof quiz !== "object") return null;

  const candidate = quiz as Record<string, unknown>;
  const options = Array.isArray(candidate.options)
    ? candidate.options.map((option) => String(option ?? "").trim()).filter(Boolean)
    : [];
  const correctIndex = Number(candidate.correct_index);

  if (!String(candidate.question ?? "").trim() || options.length < 2 || !Number.isInteger(correctIndex)) {
    return null;
  }

  return {
    question: String(candidate.question).trim(),
    options,
    correct_index: Math.max(0, Math.min(options.length - 1, correctIndex)),
    explanation_text: candidate.explanation_text ? String(candidate.explanation_text).trim() : undefined,
    hint_text: candidate.hint_text ? String(candidate.hint_text).trim() : undefined,
  };
}

function normalizeAnswerResponse(raw: Partial<GeneratedAnswer> | null, fallbackText: string): GeneratedAnswer {
  const keyPoints = Array.isArray(raw?.key_points)
    ? raw!.key_points.map((point) => String(point ?? "").trim()).filter(Boolean).slice(0, 8)
    : [];
  const quizzes = Array.isArray(raw?.quizzes)
    ? raw!.quizzes.map((quiz) => normalizeQuiz(quiz)).filter((quiz): quiz is GeneratedQuiz => Boolean(quiz))
    : [];
  const confidence = Number(raw?.answer_confidence);

  return {
    answer_text: String(raw?.answer_text || fallbackText || "Review required.").trim(),
    explanation_text: String(raw?.explanation_text || "").trim(),
    key_points: keyPoints,
    exam_tip: String(raw?.exam_tip || "").trim(),
    answer_confidence: Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : 0.65,
    quizzes,
  };
}

async function ensureAdmin(
  authHeader: string | null,
  serviceClient: ReturnType<typeof createClient>,
): Promise<void> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const userId = getUserIdFromToken(authHeader);
  if (!userId) {
    throw new Error("Invalid token");
  }

  const { data: roleData, error } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !roleData) {
    throw new Error("Admin access required");
  }
}

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to download PDF: ${response.status}`);

  const pdfBuffer = await response.arrayBuffer();
  let pdfParse: (dataBuffer: Uint8Array) => Promise<{ text?: string }>;

  try {
    pdfParse = (await import("npm:pdf-parse@1.1.1")).default;
  } catch (error) {
    throw new Error(
      `Failed to load pdf parser for ${pdfUrl}: ${error instanceof Error ? error.message : "Unknown import error"}`,
    );
  }

  let result: { text?: string };
  try {
    result = await pdfParse(new Uint8Array(pdfBuffer));
  } catch (error) {
    throw new Error(
      `Failed to parse PDF content from ${pdfUrl}: ${error instanceof Error ? error.message : "Unknown parse error"}`,
    );
  }

  return result.text || "";
}

async function callTokenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
) {
  const response = await fetch(TOKENROUTER_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`TokenRouter error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return String(data.choices?.[0]?.message?.content || "").trim();
}

async function extractQuestions(apiKey: string, courseTitle: string, materials: string): Promise<string[]> {
  const systemPrompt = `You extract tutorial and exam-prep questions from university course materials.
Return only valid JSON in this exact format:
{"questions":["Question 1","Question 2"]}

Rules:
- Extract only genuine tutorial, revision, or exam-style questions/tasks.
- Combine multipart prompts into one question entry.
- Remove duplicates, headers, and administrative noise.
- Preserve important numbering when it clarifies the question.`;

  const userPrompt = `Course: ${courseTitle}

Materials:
${materials.slice(0, 50000)}`;

  const response = await callTokenRouter(apiKey, MODEL_GPT4O_MINI, systemPrompt, userPrompt, 8192);
  const parsed = parseJsonObject<ExtractedQuestions>(response, "{");
  return normalizeQuestions(parsed?.questions);
}

async function generatePremiumAnswer(
  apiKey: string,
  courseTitle: string,
  question: string,
  materials: string,
): Promise<GeneratedAnswer> {
  const systemPrompt = `You create premium university study answers and relational quizzes.
Return only valid JSON using this schema:
{
  "answer_text": "markdown answer",
  "explanation_text": "brief deeper explanation",
  "key_points": ["point 1", "point 2"],
  "exam_tip": "short exam tip",
  "answer_confidence": 0.84,
  "quizzes": [
    {
      "question": "quiz stem",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation_text": "why it is correct",
      "hint_text": "brief hint"
    }
  ]
}

Rules:
- Use only the supplied materials.
- Make the answer exam-ready, concise, and easy to scan.
- Produce 3-5 quiz questions when the source supports it.
- Keep options plausible and similar in length.
- answer_confidence must be between 0 and 1.`;

  const userPrompt = `Course: ${courseTitle}
Tutorial question: ${question}

Course materials:
${materials.slice(0, 32000)}`;

  const response = await callTokenRouter(apiKey, MODEL_CLAUDE_SONNET, systemPrompt, userPrompt, 8192);
  const parsed = parseJsonObject<GeneratedAnswer>(response, "{");
  return normalizeAnswerResponse(parsed, response);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await ensureAdmin(req.headers.get("Authorization"), serviceClient);

    const tokenRouterKey = Deno.env.get("TOKENROUTER_API_KEY");
    if (!tokenRouterKey) {
      throw new Error("TOKENROUTER_API_KEY not configured");
    }

    const payload = (await req.json()) as GeneratePayload;
    const pdfUrls = (payload.pdf_urls || []).map((url) => url.trim()).filter(Boolean);
    const rawText = payload.raw_text?.trim() || "";

    if (!payload.course_code || !payload.course_title || !payload.department || !payload.level) {
      return new Response(JSON.stringify({ success: false, error: "Missing required course fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rawText && pdfUrls.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Provide raw_text or pdf_urls" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedPdfTexts = await Promise.all(
      pdfUrls.map(async (pdfUrl) => {
        try {
          return await extractTextFromPdf(pdfUrl);
        } catch (error) {
          console.error(`Failed to extract PDF text from ${pdfUrl}:`, error);
          return "";
        }
      }),
    );

    const materials = [rawText, ...extractedPdfTexts]
      .map((part) => part.trim())
      .filter(Boolean)
      .join("\n\n");

    if (!materials) {
      throw new Error("No readable course materials were provided");
    }

    const { data: existingCourse, error: courseLookupError } = await serviceClient
      .from("courses")
      .select("id")
      .eq("code", payload.course_code)
      .eq("faculty", payload.department)
      .limit(1)
      .maybeSingle();

    if (courseLookupError) {
      throw courseLookupError;
    }

    let courseId = existingCourse?.id;

    if (courseId) {
      const { error: updateError } = await serviceClient
        .from("courses")
        .update({
          title: payload.course_title,
          level: payload.level,
          faculty: payload.department,
        })
        .eq("id", courseId);

      if (updateError) throw updateError;
    } else {
      const { data: newCourse, error: insertCourseError } = await serviceClient
        .from("courses")
        .insert({
          code: payload.course_code,
          title: payload.course_title,
          faculty: payload.department,
          level: payload.level,
          price: 1000,
        })
        .select("id")
        .single();

      if (insertCourseError || !newCourse) {
        throw insertCourseError || new Error("Failed to create course");
      }

      courseId = newCourse.id;
    }

    const questions = await extractQuestions(tokenRouterKey, payload.course_title, materials);
    if (questions.length === 0) {
      throw new Error("No tutorial questions could be extracted from the provided materials");
    }

    await serviceClient.from("course_questions").delete().eq("course_id", courseId);

    const generatedQuestions: GeneratedAnswer[] = [];
    for (let index = 0; index < questions.length; index += QUESTION_BATCH_SIZE) {
      const batch = questions.slice(index, index + QUESTION_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((question) => generatePremiumAnswer(tokenRouterKey, payload.course_title, question, materials)),
      );
      generatedQuestions.push(...batchResults);
    }

    const questionRows = questions.map((question, index) => {
      const generated = generatedQuestions[index];
      return {
        course_id: courseId,
        question_index: index,
        question_text: question,
        answer_text: generated.answer_text,
        explanation_text: generated.explanation_text || null,
        key_points: generated.key_points,
        exam_tip: generated.exam_tip || null,
        status: "published",
        answer_confidence: generated.answer_confidence,
        content: generated.quizzes.length > 0 ? {
          quizzes: generated.quizzes.map((quiz) => ({
            question: quiz.question,
            options: quiz.options,
            correct_index: quiz.correct_index,
            explanation: quiz.explanation_text,
            hint: quiz.hint_text,
          })),
        } : null,
      };
    });

    const { data: insertedQuestions, error: insertQuestionsError } = await serviceClient
      .from("course_questions")
      .insert(questionRows)
      .select("id, question_index");

    if (insertQuestionsError || !insertedQuestions) {
      throw insertQuestionsError || new Error("Failed to save course questions");
    }

    const questionIdByIndex = new Map(insertedQuestions.map((row) => [row.question_index, row.id]));
    const quizRows = generatedQuestions.flatMap((generated, questionIndex) => {
      const questionId = questionIdByIndex.get(questionIndex);
      if (!questionId) return [];

      return generated.quizzes.map((quiz, quizIndex) => ({
        question_id: questionId,
        quiz_index: quizIndex,
        question_text: quiz.question,
        options: quiz.options,
        correct_index: quiz.correct_index,
        explanation_text: quiz.explanation_text || null,
        hint_text: quiz.hint_text || null,
      }));
    });

    if (quizRows.length > 0) {
      const { error: insertQuizzesError } = await serviceClient
        .from("question_quizzes")
        .insert(quizRows);

      if (insertQuizzesError) {
        throw insertQuizzesError;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      course_id: courseId,
      questions_count: questionRows.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-generate-course error:", error);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
