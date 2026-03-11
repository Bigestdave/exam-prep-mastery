import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Try to parse existing MCQ content from answer_text (e.g. GST 107 format)
function tryParseMCQs(answerText: string): Array<{ question: string; options: {text: string; is_correct: boolean}[] }> | null {
  // Match patterns like: "1. Question?\na) Option\nb) Option\n- ANSWER: b) ..."
  const questionBlocks = answerText.split(/\n(?=\d+\.\s)/);
  const parsed: Array<{ question: string; options: {text: string; is_correct: boolean}[] }> = [];

  for (const block of questionBlocks) {
    // Extract the question text (first line after the number)
    const questionMatch = block.match(/^\d+\.\s*(.+?)(?:\n|$)/);
    const questionText = questionMatch ? questionMatch[1].trim() : '';
    
    // Find options (a-d patterns)
    const optionMatches = block.match(/^[a-d]\)\s*(.+)$/gm);
    // Find answer
    const answerMatch = block.match(/ANSWER:\s*([a-d])\)/i);
    
    if (optionMatches && optionMatches.length >= 4 && answerMatch && questionText) {
      const correctLetter = answerMatch[1].toLowerCase();
      const options = optionMatches.slice(0, 4).map((opt, i) => {
        const letter = String.fromCharCode(97 + i); // a, b, c, d
        const text = opt.replace(/^[a-d]\)\s*/, '').trim();
        return { text, is_correct: letter === correctLetter };
      });
      
      if (options.some(o => o.is_correct)) {
        parsed.push({ question: questionText, options });
      }
    }
  }
  
  return parsed.length >= 1 ? parsed : null;
}

// Convert parsed MCQs to Edge Function quiz format for content JSONB
function mcqsToQuizFormat(questionText: string, mcqs: Array<{ question: string; options: {text: string; is_correct: boolean}[] }>): any[] {
  return mcqs.map(mcq => {
    const correctIndex = mcq.options.findIndex(o => o.is_correct);
    return {
      question: mcq.question,
      options: mcq.options.map(o => o.text),
      correct_index: correctIndex,
      hint: `From: ${questionText}`,
    };
  });
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

    const { course_code, source_course_id, force, limit } = await req.json();
    const batchLimit = limit || 10; // Process max 10 at a time to avoid timeout

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

    // If force mode, clear existing content quizzes and quiz_options
    if (force) {
      await supabase
        .from("course_questions")
        .update({ quiz_options: null, content: null })
        .eq("course_id", courseId);
    }

    // Fetch questions that don't yet have content with quizzes
    const { data: questions, error: qError } = await supabase
      .from("course_questions")
      .select("id, question_index, question_text, answer_text, content")
      .eq("course_id", courseId)
      .order("question_index")
      .limit(batchLimit);

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
          // Convert ALL parsed MCQs to quiz format and store in content JSONB
          const quizzes = mcqsToQuizFormat(q.question_text, existingMCQs);
          
          const { error: updateError } = await supabase
            .from("course_questions")
            .update({ content: { quizzes } })
            .eq("id", q.id);

          if (updateError) {
            console.error(`Update error for q${q.question_index}:`, updateError);
          } else {
            processed++;
            console.log(`q${q.question_index}: Extracted ${quizzes.length} MCQs into content.quizzes`);
          }
          continue;
        }

        // Rate limit: wait 2s between AI calls to avoid gateway throttling
        if (processed > 0) {
          await new Promise(r => setTimeout(r, 2000));
        }

        // STRATEGY 2: Use AI to generate multiple MCQs from the tutorial question itself
        const contentSnippet = q.answer_text.substring(0, 4000);
        
        const prompt = `You are an expert Educational Psychologist creating diagnostic quizzes for a Nigerian university exam prep app called LCU Prep.

Below is a TUTORIAL QUESTION and its STUDY ANSWER. Your task is to convert this tutorial question into 3-5 multiple-choice questions that test the student's understanding.

--- TUTORIAL QUESTION ---
${q.question_text}

--- STUDY ANSWER ---
${contentSnippet}
--- END ---

### STRATEGY:
Convert the tutorial question itself into MCQ format. Take each key concept, definition, or fact from the question/answer and rephrase it as an MCQ.

Example - If the tutorial question is "Explain cultural diffusion":
Quiz: "Cultural diffusion refers to:"
A) The movement of people between countries
B) The spread of cultural ideas between societies
C) The destruction of traditional cultures
D) Government control of culture

### RULES:
1. Each question must test a DIFFERENT aspect/concept from the answer.
2. The Correct Answer must be 100% accurate based on the study answer.
3. Generate 3 highly plausible wrong answers (common student misconceptions).
4. Keep each option under 20 words. All options should be similar in length.
5. Quality > Volume. Only create questions where the answer is clearly supported.

Respond with ONLY a valid JSON array of quiz objects. No markdown, no backticks:
[
  {"question": "MCQ stem here?", "options": ["A", "B", "C", "D"], "correct_index": 1, "hint": "A gentle nudge"},
  ...
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
              { role: "system", content: "You are an expert Educational Psychologist. Output ONLY valid JSON arrays. No markdown, no backticks, no explanation." },
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

        const quizArray = JSON.parse(content);

        // Validate: expect array of quiz objects with question/options/correct_index
        if (!Array.isArray(quizArray) || quizArray.length === 0) {
          console.error(`Invalid format for q${q.question_index}`);
          continue;
        }

        // Validate each quiz has a correct answer
        const validQuizzes = quizArray.filter((quiz: any) => {
          if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length !== 4) return false;
          if (typeof quiz.correct_index !== 'number' || quiz.correct_index < 0 || quiz.correct_index > 3) return false;
          return true;
        });

        if (validQuizzes.length === 0) {
          console.error(`No valid quizzes for q${q.question_index}`);
          continue;
        }

        // Store in content JSONB as quizzes array (new format)
        const { error: updateError } = await supabase
          .from("course_questions")
          .update({ content: { quizzes: validQuizzes } })
          .eq("id", q.id);

        if (updateError) {
          console.error(`Update error for q${q.question_index}:`, updateError);
        } else {
          processed++;
          console.log(`q${q.question_index}: Generated ${validQuizzes.length} MCQs from tutorial question`);
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
