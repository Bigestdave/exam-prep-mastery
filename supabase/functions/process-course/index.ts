import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// TokenRouter API details
const TOKENROUTER_GATEWAY = "https://api.tokenrouter.com/v1/chat/completions";
const MODEL_GPT4O_MINI = "openai/gpt-4o-mini";
const MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4.6";

interface ProcessPayload {
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  pdf_urls?: string[];
  raw_text?: string;
  upload_id?: string;
  ambassador_user_id?: string;
}

async function updateUploadStatus(
  client: ReturnType<typeof createClient>,
  uploadId: string | undefined,
  status: string,
  extra: Record<string, unknown> = {}
) {
  if (!uploadId) return;
  await client
    .from("course_uploads")
    .update({ status, ...extra })
    .eq("id", uploadId);
}

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to download PDF: ${response.status}`);

  const pdfBuffer = await response.arrayBuffer();
  const pdfParse = (await import("npm:pdf-parse@1.1.1")).default;
  const result = await pdfParse(new Uint8Array(pdfBuffer));
  return result.text || "";
}

async function callTokenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
): Promise<string> {
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
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TokenRouter Gateway error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractQuestions(apiKey: string, pdfText: string): Promise<string[]> {
  const systemPrompt = `You are an expert at identifying study questions from academic course materials.
Extract ALL numbered or lettered questions, prompts, and study tasks from the text.
Look for items starting with action words like 'List', 'Define', 'Explain', 'Discuss', 'State', 'Describe', 'What', 'How', 'Why', 'Enumerate', as well as numbered items (1., 2., a., b.).

IMPORTANT: If a question has multiple sub-parts (e.g., 1a, 1b, 1c or 1(i), 1(ii)), you MUST combine them into ONE single question entry. Keep the full numbering and all sub-parts together as one string.

Ignore headers, footers, administrative text, and syllabus information.
Return ONLY a JSON object in this exact format: {"questions": ["full question 1 with all sub-parts", "full question 2 with all sub-parts"]}
If no questions are found, return: {"questions": []}`;

  const userPrompt = `Extract all study questions from this course material:\n\n${pdfText.slice(0, 30000)}`;

  const result = await callTokenRouter(apiKey, MODEL_GPT4O_MINI, systemPrompt, userPrompt, 8192);

  try {
    const jsonMatch = result.match(/\{[\s\S]*"questions"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed.questions)) {
        return parsed.questions.filter((q: string) => q && q.trim().length > 5);
      }
    }
  } catch (e) {
    console.error("Failed to parse questions JSON:", e, "Raw:", result.slice(0, 500));
  }
  return [];
}

interface PremiumQuiz {
  quiz_index?: number;
  quiz_type?: string;
  quiz_question?: string;
  question?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  options?: string[] | Record<string, string>;
  correct_answer?: string;
  explanation?: string;
  hint?: string;
  difficulty?: string;
}

interface PremiumContent {
  question: string;
  answer: string;
  explanation: string;
  key_points: string[];
  exam_tip: string;
  quizzes: PremiumQuiz[];
}

function normalizeQuiz(quiz: PremiumQuiz): Record<string, unknown> | null {
  const question = String(quiz.quiz_question || quiz.question || "").trim();
  if (!question) return null;

  let options: string[] = [];
  if (Array.isArray(quiz.options)) {
    options = quiz.options.map((o) => String(o));
  } else {
    const fromFields = [quiz.option_a, quiz.option_b, quiz.option_c, quiz.option_d]
      .filter((o): o is string => Boolean(o && String(o).trim()))
      .map((o) => String(o));

    if (fromFields.length > 0) {
      options = fromFields;
    } else if (quiz.options && typeof quiz.options === "object") {
      const obj = quiz.options as Record<string, string>;
      options = ["A", "B", "C", "D"].filter((k) => obj[k]).map((k) => String(obj[k]));
    }
  }

  if (options.length < 2) return null;

  let correctIndex = 0;
  const correct = String(quiz.correct_answer || "").trim();
  if (correct) {
    const upper = correct.toUpperCase();
    const asLetter = ["A", "B", "C", "D"].indexOf(upper);
    if (asLetter >= 0 && asLetter < options.length) {
      correctIndex = asLetter;
    } else {
      const byText = options.findIndex((o) => o.trim().toLowerCase() === correct.toLowerCase());
      if (byText >= 0) correctIndex = byText;
    }
  }

  return {
    question,
    options,
    correct_index: correctIndex,
    hint: quiz.explanation || quiz.hint || "",
    explanation: quiz.explanation || "",
    difficulty: quiz.difficulty || "Medium",
    quiz_type: quiz.quiz_type || "MCQ",
    quiz_index: typeof quiz.quiz_index === "number" ? quiz.quiz_index : null,
  };
}

async function generatePremiumGuide(
  apiKey: string,
  question: string,
  context: string,
  courseTitle: string
): Promise<PremiumContent | null> {
  const systemPrompt = `You are an expert academic tutor and first-class graduate. Your job is to prepare clear, accurate, exam-ready tutorial answers and quizzes for university students using the course materials provided.

Main Objective:
Generate answers that students can understand, remember, and write in an exam. The answers must feel human, natural, lecturer-faithful, and academically correct.

Source Rule:
Base your answers primarily on the course materials. If the materials are insufficient, use standard academic knowledge, but keep it aligned with the course context.

Required Output Format:
You MUST return a JSON object with EXACTLY this structure:
{
  "question": "Exact tutorial question being answered",
  "answer": "Give a direct, exam-ready answer.",
  "explanation": "Explain the idea in simple academic language.",
  "key_points": ["Important point 1", "Important point 2", "Important point 3"],
  "exam_tip": "Briefly tell the student how to present the answer in an exam.",
  "quizzes": [
    {
      "quiz_index": 0,
      "quiz_type": "MCQ/True or False/Fill in the Gap/Short Answer/Application",
      "quiz_question": "Quiz question to test understanding",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_answer": "Correct answer text",
      "explanation": "Brief explanation",
      "difficulty": "Easy/Medium/Hard"
    }
  ]
}

Rules:
1. The output MUST be valid JSON, with no surrounding markdown.
2. For each question, generate 5 to 7 quiz questions.
3. Include a mix of MCQ, True/False, Fill-in-the-gap, Short answer, and Application-based quiz types.
4. MCQs must have exactly 4 options when MCQ is selected.`;

  const userPrompt = `Course: ${courseTitle}\n\n[Specific Question]: ${question}\n\n[Course Notes Context]:\n${context.slice(0, 20000)}`;

  const result = await callTokenRouter(apiKey, MODEL_CLAUDE_SONNET, systemPrompt, userPrompt);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as PremiumContent;
    }
  } catch (e) {
    console.error("Failed to parse premium guide JSON:", e, "Raw:", result.slice(0, 500));
  }
  return null;
}

async function processCourse(payload: ProcessPayload) {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch TokenRouter API key with fallback to Lovable API key
  const apiKey = Deno.env.get("TOKENROUTER_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("TOKENROUTER_API_KEY or LOVABLE_API_KEY not configured");

  const { course_code, course_title, department, level, pdf_urls, raw_text, upload_id } = payload;

  try {
    await updateUploadStatus(serviceClient, upload_id, "processing");

    let fullText = "";
    if (raw_text && raw_text.trim()) {
      fullText = raw_text;
    } else if (pdf_urls && pdf_urls.length > 0) {
      await updateUploadStatus(serviceClient, upload_id, "extracting");
      for (const url of pdf_urls) {
        try {
          const text = await extractTextFromPdf(url);
          fullText += text + "\n\n";
        } catch (e) {
          console.error(`Failed to extract text from ${url}:`, e);
        }
      }
    }

    if (!fullText.trim()) {
      await updateUploadStatus(serviceClient, upload_id, "failed", {
        error_message: "No content text found. Please provide either raw text or course PDFs.",
      });
      return { success: false, error: "No content text found" };
    }

    console.log(`Extracted/Received ${fullText.length} characters of text`);

    // Find or create the course
    const { data: existingCourse } = await serviceClient
      .from("courses")
      .select("id")
      .eq("code", course_code)
      .eq("faculty", department)
      .maybeSingle();

    let courseId: string;

    if (existingCourse) {
      courseId = existingCourse.id;
    } else {
      const { data: newCourse, error: courseErr } = await serviceClient
        .from("courses")
        .insert({
          code: course_code,
          title: course_title,
          faculty: department,
          level: level || "100L",
          price: 1000,
        })
        .select("id")
        .single();

      if (courseErr || !newCourse) {
        throw new Error(`Failed to create course: ${courseErr?.message}`);
      }
      courseId = newCourse.id;
    }

    // Clear existing content to prevent duplicates and ensure a clean slate
    await serviceClient.from("course_questions").delete().eq("course_id", courseId);

    // Extract questions
    await updateUploadStatus(serviceClient, upload_id, "extracting");
    const questions = await extractQuestions(apiKey, fullText);

    if (questions.length === 0) {
      await updateUploadStatus(serviceClient, upload_id, "failed", {
        error_message: "No study questions could be identified in the uploaded material.",
      });
      return { success: false, error: "No study questions found" };
    }

    console.log(`Extracted ${questions.length} questions`);

    // Generate study guides and quizzes
    await updateUploadStatus(serviceClient, upload_id, "generating");

    const BATCH_SIZE = 2;
    const rowsToInsert: Array<{
      course_id: string;
      question_index: number;
      question_text: string;
      answer_text: string;
      status: string;
      content: Record<string, unknown>;
    }> = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((q) => generatePremiumGuide(apiKey, q, fullText, course_title))
      );

      for (let j = 0; j < batch.length; j++) {
        const result = results[j];
        if (!result) continue;

        const normalizedQuizzes = Array.isArray(result.quizzes)
          ? result.quizzes
              .map((quiz) => normalizeQuiz(quiz))
              .filter((quiz): quiz is Record<string, unknown> => quiz !== null)
          : [];

        rowsToInsert.push({
          course_id: courseId,
          question_index: i + j,
          question_text: batch[j],
          answer_text: result.answer || "",
          status: "published",
          content: {
            explanation: result.explanation || "",
            key_points: Array.isArray(result.key_points) ? result.key_points : [],
            exam_tip: result.exam_tip || "",
            quizzes: normalizedQuizzes,
          },
        });
      }
    }

    if (rowsToInsert.length === 0) {
      await updateUploadStatus(serviceClient, upload_id, "failed", {
        error_message: "Failed to generate any study guides from extracted questions.",
      });
      return { success: false, error: "No study guides generated" };
    }

    const { error: insertErr } = await serviceClient
      .from("course_questions")
      .insert(rowsToInsert);

    if (insertErr) {
      throw new Error(`Failed to save questions: ${insertErr.message}`);
    }

    await updateUploadStatus(serviceClient, upload_id, "complete", {
      questions_generated: rowsToInsert.length,
    });

    console.log(`✅ Completed processing: ${rowsToInsert.length} questions and quizzes saved.`);
    return { success: true, questions_count: rowsToInsert.length, course_id: courseId };
  } catch (error) {
    console.error("Processing error:", error);
    await updateUploadStatus(serviceClient, upload_id, "failed", {
      error_message: error instanceof Error ? error.message : "Processing failed unexpectedly",
    });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ProcessPayload = await req.json();

    if (!payload.course_code || !payload.course_title || !payload.department) {
      return new Response(
        JSON.stringify({ error: "Missing required metadata fields (course_code, course_title, department)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await processCourse(payload);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-course error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
