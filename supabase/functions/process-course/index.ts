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
  const systemPrompt = `You are the ultimate University Tutor for "LCU Prep", a Nigerian exam preparation app. Your goal is to eliminate exam anxiety by breaking down complex university-level concepts into language so clear that an SS2 (Senior Secondary 2 / 16-year-old) student can immediately understand it.

You will be provided with [Course Notes] and a [Specific Question]. 
Rely ONLY on the [Course Notes] to answer the question. Do not invent outside information. If the notes are incomplete for the question, state: "The provided notes do not contain full details for this question."

You MUST return a JSON object with EXACTLY this schema:
{
  "answer_text": "The fully formatted markdown answer following the REQUIRED STRUCTURE below",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "quiz": {
    "question": "A diagnostic MCQ testing actual understanding of the core concept",
    "options": ["First plausible option", "Second plausible option", "Third plausible option", "Fourth plausible option"],
    "correct_index": 0,
    "hint": "A gentle nudge that helps think about the concept without giving the answer away",
    "explanation": "Why the correct answer is right and the others are wrong"
  }
}

### REQUIRED STRUCTURE FOR 'answer_text':

**1. Direct Answer:**
Provide a 1-2 sentence, punchy, direct answer to the question. No fluff. Get straight to the point.

**2. Explanation:**
Explain the concept at an SS2 reading level. Use short sentences. Avoid dense academic jargon. If you must use a technical term, define it immediately in simple English. Speak directly to the student as "you".

**3. Example:**
Provide a realistic, highly relatable example. Use scenarios a Nigerian university student would understand (e.g., buying food at the cafeteria, using a smartphone, navigating campus, local businesses). Make the abstract concept concrete.

**4. 💡 TL;DR:**
Provide a 1-sentence summary that the student can easily memorize for the exam hall.

%%% Why This Is Correct
[Write a 1-2 sentence authoritative explanation proving why this answer aligns with the course notes. This will be rendered as a special UI block.] %%%

### QUIZ RULES:
1. The Question: Must be clear, concise, and focused on the most important takeaway.
2. The Correct Answer: Must be 100% accurate based ONLY on the course notes.
3. The Distractors (Wrong Answers): Generate 3 highly plausible wrong answers representing common student misconceptions. Do NOT make the correct answer obviously longer or more detailed than the wrong answers.
4. The Hint: A gentle nudge without giving the answer away.

### STRICT FORMATTING RULES:
- NEVER use em dashes (—). Use standard hyphens (-) or colons (:).
- Use bolding for keywords to make the text skimmable.
- NEVER use phrases like "According to the notes," or "The document states." Just answer directly.
- The output MUST be valid JSON.`;

  const userPrompt = `Course: ${courseTitle}\n\n[Specific Question]: ${question}\n\n[Course Notes]:\n${pdfContext.slice(0, 8000)}`;

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
          quiz: parsed.quiz || null,
        },
      };
    }
  } catch (e) {
    console.error("Failed to parse study guide JSON:", e);
  }

  return {
    answer_text: "Study guide content available.",
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
