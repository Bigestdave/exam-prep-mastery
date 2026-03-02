import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Try to parse existing MCQ content from answer_text (e.g. GST 107 format)
function tryParseMCQs(answerText: string): Array<{text: string; is_correct: boolean}[]> | null {
  // Match patterns like: "1. Question?\na) Option\nb) Option\n- ANSWER: b) ..."
  const questionBlocks = answerText.split(/\n(?=\d+\.\s)/);
  const parsed: Array<{text: string; is_correct: boolean}[]> = [];

  for (const block of questionBlocks) {
    // Find options (a-d patterns)
    const optionMatches = block.match(/^[a-d]\)\s*(.+)$/gm);
    // Find answer
    const answerMatch = block.match(/ANSWER:\s*([a-d])\)/i);
    
    if (optionMatches && optionMatches.length >= 4 && answerMatch) {
      const correctLetter = answerMatch[1].toLowerCase();
      const options = optionMatches.slice(0, 4).map((opt, i) => {
        const letter = String.fromCharCode(97 + i); // a, b, c, d
        const text = opt.replace(/^[a-d]\)\s*/, '').trim();
        return { text, is_correct: letter === correctLetter };
      });
      
      if (options.some(o => o.is_correct)) {
        parsed.push(options);
      }
    }
  }
  
  return parsed.length >= 3 ? parsed : null; // Only use if we found enough MCQs
}

// Pick a random subset of MCQs and create a single quiz option set
function pickRandomMCQ(mcqs: Array<{text: string; is_correct: boolean}[]>): {text: string; is_correct: boolean}[] {
  const idx = Math.floor(Math.random() * mcqs.length);
  return mcqs[idx];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { course_code, source_course_id } = await req.json();

    if (!source_course_id && !course_code) {
      return new Response(JSON.stringify({ error: "Provide source_course_id or course_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the source questions
    let courseId = source_course_id;
    if (!courseId && course_code) {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("code", course_code)
        .limit(1)
        .maybeSingle();
      if (!course) {
        return new Response(JSON.stringify({ error: `No course found for ${course_code}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      courseId = course.id;
    }

    const { data: questions, error: qError } = await supabase
      .from("course_questions")
      .select("id, question_index, question_text, answer_text")
      .eq("course_id", courseId)
      .is("quiz_options", null)
      .order("question_index");

    if (qError || !questions?.length) {
      return new Response(JSON.stringify({ error: "No questions to process", details: qError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const q of questions) {
      try {
        // STRATEGY 1: Try to parse existing MCQs from the answer_text
        const existingMCQs = tryParseMCQs(q.answer_text);
        
        if (existingMCQs && existingMCQs.length > 0) {
          // Content already has MCQs - pick one at random
          const quizOptions = pickRandomMCQ(existingMCQs);
          
          const { error: updateError } = await supabase
            .from("course_questions")
            .update({ quiz_options: quizOptions })
            .eq("id", q.id);

          if (updateError) {
            console.error(`Update error for q${q.question_index}:`, updateError);
          } else {
            processed++;
            console.log(`q${q.question_index}: Parsed existing MCQ directly from content`);
          }
          continue;
        }

        // STRATEGY 2: Use AI to generate quiz from the tutorial CONTENT (not header)
        // Send more content (up to 4000 chars) for better context
        const contentSnippet = q.answer_text.substring(0, 4000);
        
        const prompt = `You are a quiz generator for a Nigerian university exam prep app called LCU Prep.

Below is the TUTORIAL CONTENT (explanations, notes, or Q&A) for a specific module. Your job is to generate exactly 4 multiple-choice options that test the student's understanding of the KEY CONCEPTS in this content.

--- TUTORIAL CONTENT START ---
${contentSnippet}
--- TUTORIAL CONTENT END ---

Module Title (for context only): ${q.question_text}

RULES:
1. The correct answer MUST come directly from the tutorial content above. Do NOT invent facts.
2. Generate 4 options: exactly 1 correct, 3 plausible but wrong.
3. Wrong options should be related to the topic but factually incorrect based on the content.
4. Keep each option under 20 words. Be concise.
5. Randomize which position (1-4) is the correct answer.
6. The question being tested should focus on a CORE concept from the content, not a trivial detail.

Respond with ONLY a valid JSON array. No markdown, no backticks, no explanation:
[
  {"text": "Option text here", "is_correct": false},
  {"text": "Correct option text here", "is_correct": true},
  {"text": "Option text here", "is_correct": false},
  {"text": "Option text here", "is_correct": false}
]`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a quiz generator. Output ONLY valid JSON arrays. No markdown, no backticks, no explanation." },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for q${q.question_index}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        let content = aiData.choices?.[0]?.message?.content?.trim() || "";

        // Clean markdown if present
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const quizOptions = JSON.parse(content);

        // Validate format
        if (!Array.isArray(quizOptions) || quizOptions.length !== 4) {
          console.error(`Invalid format for q${q.question_index}`);
          continue;
        }

        const hasCorrect = quizOptions.some((o: { is_correct: boolean }) => o.is_correct);
        if (!hasCorrect) {
          console.error(`No correct answer for q${q.question_index}`);
          continue;
        }

        // Update the question
        const { error: updateError } = await supabase
          .from("course_questions")
          .update({ quiz_options: quizOptions })
          .eq("id", q.id);

        if (updateError) {
          console.error(`Update error for q${q.question_index}:`, updateError);
        } else {
          processed++;
          console.log(`q${q.question_index}: AI-generated quiz from content`);
        }
      } catch (e) {
        console.error(`Error processing q${q.question_index}:`, e);
      }
    }

    // Now propagate quiz_options to all other courses with same code
    if (course_code) {
      const { data: allCourses } = await supabase
        .from("courses")
        .select("id")
        .eq("code", course_code)
        .neq("id", courseId);

      if (allCourses?.length) {
        const { data: sourceQs } = await supabase
          .from("course_questions")
          .select("question_index, quiz_options")
          .eq("course_id", courseId)
          .not("quiz_options", "is", null);

        if (sourceQs?.length) {
          for (const targetCourse of allCourses) {
            for (const sq of sourceQs) {
              await supabase
                .from("course_questions")
                .update({ quiz_options: sq.quiz_options })
                .eq("course_id", targetCourse.id)
                .eq("question_index", sq.question_index);
            }
          }
          console.log(`Propagated to ${allCourses.length} other courses`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed,
      total: questions.length,
      message: `Generated quiz options for ${processed}/${questions.length} questions` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz-options error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
