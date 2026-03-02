import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        const prompt = `Based on this educational content, generate exactly 4 multiple-choice quiz options. One must be correct, three must be plausible but wrong.

Question/Topic: ${q.question_text}

Answer Content (first 1500 chars): ${q.answer_text.substring(0, 1500)}

Respond with ONLY a JSON array, no markdown, no explanation:
[
  {"text": "Option A text", "is_correct": false},
  {"text": "Option B text (correct one)", "is_correct": true},
  {"text": "Option C text", "is_correct": false},
  {"text": "Option D text", "is_correct": false}
]

Rules:
- The correct answer MUST come from the provided content
- Wrong answers must be plausible (related to the topic, not absurd)
- Keep options concise (under 15 words each)
- Randomize which position (A-D) is correct
- Make the question testable from the content provided`;

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
        // Get source questions with quiz_options
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
