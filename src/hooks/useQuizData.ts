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
  question_text: string;
  answer_text: string;
  quiz_options: QuizOption[] | null;
}

export interface QuizAttempt {
  course_id: string;
  score: number;
  total_questions: number;
  percentage: number;
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

      const { data, error } = await supabase
        .from('course_questions')
        .select('id, course_id, question_index, question_text, answer_text, quiz_options')
        .eq('course_id', courseId)
        .not('quiz_options', 'is', null)
        .order('question_index', { ascending: true });

      if (!error && data) {
        const parsed = data.map(q => ({
          ...q,
          quiz_options: q.quiz_options as unknown as QuizOption[] | null,
        }));
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
