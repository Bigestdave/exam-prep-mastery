import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuizOption {
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  course_id: string;
  question_index: number;
  question_text: string; // Module title (fallback)
  quiz_question_text: string; // The actual quiz question to display
  answer_text: string;
  quiz_options: QuizOption[];
  hint?: string;
}

export interface QuizAttempt {
  course_id: string;
  score: number;
  total_questions: number;
  percentage: number;
}

/**
 * Converts n8n's structured_content.quiz format to our QuizOption[] format.
 * n8n format: { question, options: {A,B,C,D}, correct_answer: "B", hint }
 */
function parseN8nQuiz(structured: any): { question: string; options: QuizOption[]; hint?: string } | null {
  try {
    const content = typeof structured === 'string' ? JSON.parse(structured) : structured;
    const quiz = content?.quiz;
    if (!quiz?.options || !quiz?.correct_answer) return null;

    const letters = ['A', 'B', 'C', 'D'];
    const options: QuizOption[] = letters
      .filter(l => quiz.options[l])
      .map(l => ({
        text: quiz.options[l],
        is_correct: quiz.correct_answer.toUpperCase() === l,
      }));

    if (options.length < 2 || !options.some(o => o.is_correct)) return null;

    return {
      question: quiz.question || '',
      options,
      hint: quiz.hint,
    };
  } catch {
    return null;
  }
}

export function useQuizData(courseId: string | undefined) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasQuizData, setHasQuizData] = useState(false);

  useEffect(() => {
    const fetchQuizQuestions = async () => {
      if (!courseId) {
        setIsLoading(false);
        return;
      }

      // Fetch questions that have EITHER quiz_options OR structured_content with quiz
      const { data, error } = await supabase
        .from('course_questions')
        .select('id, course_id, question_index, question_text, answer_text, quiz_options, structured_content, content')
        .eq('course_id', courseId)
        .order('question_index', { ascending: true });

      if (!error && data) {
        const parsed: QuizQuestion[] = [];

        for (const q of data) {
          // Priority 1: n8n content.quiz (new column)
          const n8nQuiz = parseN8nQuiz(q.content) || parseN8nQuiz(q.structured_content);
          if (n8nQuiz) {
            parsed.push({
              id: q.id,
              course_id: q.course_id,
              question_index: q.question_index,
              question_text: q.question_text,
              quiz_question_text: n8nQuiz.question,
              answer_text: q.answer_text,
              quiz_options: n8nQuiz.options,
              hint: n8nQuiz.hint,
            });
            continue;
          }

          // Priority 2: Legacy quiz_options column
          const legacyOptions = q.quiz_options as unknown as QuizOption[] | null;
          if (legacyOptions && Array.isArray(legacyOptions) && legacyOptions.length >= 2) {
            parsed.push({
              id: q.id,
              course_id: q.course_id,
              question_index: q.question_index,
              question_text: q.question_text,
              quiz_question_text: q.question_text, // Use module title as fallback
              answer_text: q.answer_text,
              quiz_options: legacyOptions,
            });
          }
        }

        setQuestions(parsed);
        setHasQuizData(parsed.length > 0);
      }
      setIsLoading(false);
    };

    fetchQuizQuestions();
  }, [courseId]);

  return { questions, isLoading, hasQuizData };
}

export function useBestQuizAttempt(courseId: string | undefined, userId: string | undefined) {
  const [best, setBest] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!courseId || !userId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .order('percentage', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBest({
          course_id: data.course_id,
          score: data.score,
          total_questions: data.total_questions,
          percentage: data.percentage ?? 0,
        });
      }
      setIsLoading(false);
    };

    fetch();
  }, [courseId, userId]);

  return { best, isLoading };
}

export function useSemesterReadiness(userId: string | undefined, courseIds: string[]) {
  const [readiness, setReadiness] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!userId || courseIds.length === 0) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('course_id, percentage')
        .eq('user_id', userId)
        .in('course_id', courseIds)
        .order('percentage', { ascending: false });

      if (!error && data) {
        const bestPerCourse = new Map<string, number>();
        data.forEach(row => {
          const existing = bestPerCourse.get(row.course_id) ?? 0;
          if ((row.percentage ?? 0) > existing) {
            bestPerCourse.set(row.course_id, row.percentage ?? 0);
          }
        });
        setReadiness(bestPerCourse);
      }
      setIsLoading(false);
    };

    fetch();
  }, [userId, courseIds.join(',')]);

  const totalPercentage = courseIds.length > 0
    ? Math.round(
        courseIds.reduce((sum, id) => sum + (readiness.get(id) ?? 0), 0) / courseIds.length
      )
    : 0;

  return { readiness, totalPercentage, isLoading };
}
