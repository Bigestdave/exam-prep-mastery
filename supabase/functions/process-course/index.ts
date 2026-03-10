import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";

interface ProcessPayload {
  course_code: string;
  course_title: string;
  department: string;
  level: string;
  pdf_urls: string[];
  upload_id: string;
  ambassador_user_id: string;
}

async function updateUploadStatus(
  client: ReturnType<typeof createClient>,
  uploadId: string,
  status: string,
  extra: Record<string, unknown> = {}
) {
  await client
    .from("course_uploads")
    .update({ status, ...extra })
    .eq("id", uploadId);
}

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  // Download the PDF
  const response = await fetch(pdfUrl);
  if (!response.ok) throw new Error(`Failed to download PDF: ${response.status}`);

  const pdfBuffer = await response.arrayBuffer();

  // Use pdf-parse to extract text
  const pdfParse = (await import("npm:pdf-parse@1.1.1")).default;
  const result = await pdfParse(new Uint8Array(pdfBuffer));
  return result.text || "";
}

async function callAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
): Promise<string> {
  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractQuestions(apiKey: string, pdfText: string): Promise<string[]> {
  const systemPrompt = `You are an expert at identifying study questions from academic course materials. 
Extract ALL numbered or lettered questions, prompts, and study tasks from the text.
Look for items starting with action words like 'List', 'Define', 'Explain', 'Discuss', 'State', 'Describe', 'What', 'How', 'Why', 'Enumerate', as well as numbered items (1., 2., a., b.).

IMPORTANT: If a question has multiple sub-parts (e.g., 1a, 1b, 1c or 1(i), 1(ii)), you MUST combine them into ONE single question entry. Keep the full numbering and all sub-parts together as one string. For example:
"1. (a) Define osmosis. (b) List three examples of osmosis in everyday life. (c) Differentiate between osmosis and diffusion."
This should be ONE entry, NOT three separate entries.

Ignore headers, footers, administrative text, and syllabus information.
Return ONLY a JSON object in this exact format: {"questions": ["full question 1 with all sub-parts", "full question 2 with all sub-parts", ...]}
If no questions are found, return: {"questions": []}`;

  const userPrompt = `Extract all study questions from this course material:\n\n${pdfText.slice(0, 30000)}`;

  const result = await callAI(apiKey, systemPrompt, userPrompt, 8192);

  // Parse the JSON from the response
  try {
    // Try to find JSON in the response
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

async function generateStudyGuide(
  apiKey: string,
  question: string,
  pdfContext: string,
  courseTitle: string
): Promise<{ answer_text: string; content: Record<string, unknown> }> {
  const systemPrompt = `You are an expert University Tutor for "LCU Prep", creating First-Class, exam-ready solutions for students. Your goal is to provide answers that are highly accurate, directly to the point, and incredibly easy to read (SS2 / 16-year-old clarity).

You will be provided with [Course Notes] and a [Tutorial Question].
Rely ONLY on the [Course Notes]. Do not invent outside information.

### HOW TO ANSWER:
Do NOT force a rigid template. Adapt your answer format based on what the question is asking:
- If it asks for a LIST: Use numbered bullet points with the key term in **bold**, followed by a short, clear explanation.
- If it asks for a DEFINITION: Give a direct, punchy 1-2 sentence definition with the core concept in **bold**.
- If it is a MATH/CALCULATION question: Show the parameters, the formula, and the step-by-step calculation clearly.
- If it is a DISCUSSION/ESSAY: Break the answer down into short, readable paragraphs with bolded headers.

### STRICT FORMATTING RULES:
1. NO fluff. NO introductory or concluding pleasantries (e.g., "Here is the answer," or "In conclusion"). Start answering immediately.
2. Use **bolding** generously for keywords, headers, and core concepts to make the text highly skimmable.
3. NEVER use phrases like "According to the notes," or "The document states." State the facts authoritatively.
4. NEVER use em dashes (—). Use standard hyphens (-) or colons (:).
5. If a question asks for a specific number of points and the notes only cover fewer, state clearly: "The provided notes only cover [X] of the [Y] requested points."

### THE PROFESSOR'S EXPLANATION BLOCK:
At the very end of your answer, you MUST include a 1-2 sentence explanation wrapped EXACTLY in three percentage signs. This block should briefly explain why the answer aligns with the course concepts or point out how it was derived.
Format it exactly like this:
%%% This is correct because [insert brief, authoritative justification here]. %%%

### QUIZ GENERATION:
Generate 4-5 multiple-choice quiz questions per tutorial question. Convert the tutorial question ITSELF into MCQ format rather than inventing new questions.

Strategy: Take each key concept, definition, or fact from the tutorial question and its answer, and rephrase it as an MCQ.

For each quiz:
1. The Question: Rephrase part of the tutorial question/answer as an MCQ stem.
2. The Correct Answer: Must be 100% accurate based ONLY on the course notes.
3. The Distractors: Generate 3 highly plausible wrong answers representing common student misconceptions. Keep all options similar in length.
4. The Hint: A gentle nudge that helps think about the concept without giving it away.

Quality > Volume. Only generate quizzes where the answer is clearly supported by the notes.

You MUST return a JSON object with EXACTLY this schema:
{
  "answer_text": "The fully formatted markdown answer including the %%% block at the end",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "quizzes": [
    {
      "question": "MCQ stem derived from the tutorial question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "hint": "A gentle nudge without giving the answer away",
      "explanation": "Why the correct answer is right"
    }
  ]
}

The output MUST be valid JSON.`;

  const userPrompt = `Course: ${courseTitle}\n\n[Specific Question]: ${question}\n\n[Course Notes]:\n${pdfContext.slice(0, 25000)}`;

  const result = await callAI(apiKey, systemPrompt, userPrompt);

  try {
    const jsonMatch = result.match(/\{[\s\S]*"answer_text"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        answer_text: parsed.answer_text || "See study guide for details.",
        content: {
          explanation: parsed.explanation || "",
          key_points: parsed.key_points || [],
          quizzes: parsed.quizzes || (parsed.quiz ? [parsed.quiz] : []),
        },
      };
    }
  } catch (e) {
    console.error("Failed to parse study guide JSON:", e, "Raw:", result.slice(0, 500));
  }

  // Fallback: use the raw AI text as the answer instead of placeholder
  return {
    answer_text: result || "The AI could not generate a proper answer for this question. Please review manually.",
    content: { explanation: result, key_points: [], quiz: null },
  };
}

async function processCourse(payload: ProcessPayload) {
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const { course_code, course_title, department, level, pdf_urls, upload_id, ambassador_user_id } = payload;

  try {
    // Step 1: Update status to processing
    await updateUploadStatus(serviceClient, upload_id, "processing");

    // Step 2: Download and extract text from all PDFs
    await updateUploadStatus(serviceClient, upload_id, "extracting");
    let fullText = "";
    for (const url of pdf_urls) {
      try {
        const text = await extractTextFromPdf(url);
        fullText += text + "\n\n";
      } catch (e) {
        console.error(`Failed to extract text from ${url}:`, e);
      }
    }

    if (!fullText.trim()) {
      await updateUploadStatus(serviceClient, upload_id, "failed", {
        error_message: "Could not extract text from the uploaded PDF(s). Please ensure the files contain readable text.",
      });
      return;
    }

    console.log(`Extracted ${fullText.length} characters from ${pdf_urls.length} PDF(s)`);

    // Step 3: Find or create the course
    const { data: existingCourse } = await serviceClient
      .from("courses")
      .select("id")
      .eq("code", course_code)
      .eq("faculty", department)
      .maybeSingle();

    let courseId: string;

    if (existingCourse) {
      courseId = existingCourse.id;
      // Check if questions already exist
      const { count } = await serviceClient
        .from("course_questions")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId);

      if (count && count > 0) {
        // Course already has content, mark complete
        await updateUploadStatus(serviceClient, upload_id, "complete", {
          questions_generated: count,
        });
        return;
      }
    } else {
      // Create new course
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

    // Step 4: Extract questions using AI
    await updateUploadStatus(serviceClient, upload_id, "extracting");
    const questions = await extractQuestions(apiKey, fullText);

    if (questions.length === 0) {
      await updateUploadStatus(serviceClient, upload_id, "failed", {
        error_message: "No study questions could be identified in the uploaded material.",
      });
      return;
    }

    console.log(`Extracted ${questions.length} questions`);

    // Step 5: Generate study guides for each question (in parallel batches of 3)
    await updateUploadStatus(serviceClient, upload_id, "generating");
    const BATCH_SIZE = 3;
    const savedQuestions: Array<{
      course_id: string;
      question_index: number;
      question_text: string;
      answer_text: string;
      content: Record<string, unknown>;
    }> = [];

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((q) => generateStudyGuide(apiKey, q, fullText, course_title))
      );

      for (let j = 0; j < batch.length; j++) {
        savedQuestions.push({
          course_id: courseId,
          question_index: i + j,
          question_text: batch[j],
          answer_text: results[j].answer_text,
          content: results[j].content,
          status: "draft",
        });
      }
    }

    // Step 6: Save all questions to database
    const { error: insertErr } = await serviceClient
      .from("course_questions")
      .insert(savedQuestions);

    if (insertErr) {
      throw new Error(`Failed to save questions: ${insertErr.message}`);
    }

    // Step 7: Mark upload as complete
    await updateUploadStatus(serviceClient, upload_id, "complete", {
      questions_generated: savedQuestions.length,
    });

    console.log(`✅ Course ${course_code} processed: ${savedQuestions.length} questions saved`);
  } catch (error) {
    console.error("Processing error:", error);
    await updateUploadStatus(serviceClient, upload_id, "failed", {
      error_message: error instanceof Error ? error.message : "Processing failed unexpectedly",
    });
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is called internally (from trigger-processing) or by an admin
    const payload: ProcessPayload = await req.json();

    if (
      !payload.course_code ||
      !payload.course_title ||
      !payload.department ||
      !payload.pdf_urls?.length ||
      !payload.upload_id ||
      !payload.ambassador_user_id
    ) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process synchronously — the caller (trigger-processing) doesn't await this
    await processCourse(payload);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
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
