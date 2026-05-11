import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CourseQuestion {
  id: string;
  course_id: string;
  question_index: number;
  question_text: string;
  answer_text: string;
}

// Per-course cache so revisits feel instant.
const questionsCache: Record<string, CourseQuestion[]> = {};
const SS_PREFIX = 'lcu_qcache_v1_';
function readCache(courseId: string): CourseQuestion[] | null {
  if (questionsCache[courseId]) return questionsCache[courseId];
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + courseId);
    if (raw) {
      const parsed = JSON.parse(raw) as CourseQuestion[];
      questionsCache[courseId] = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

export function useCourseQuestions(courseId: string | undefined) {
  const initial = courseId ? readCache(courseId) : null;
  const [questions, setQuestions] = useState<CourseQuestion[]>(initial ?? []);
  const [isLoading, setIsLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!courseId) {
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    const cached = readCache(courseId);
    if (cached) {
      setQuestions(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('course_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('question_index', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      console.error('Failed to load questions:', fetchError);
      // Only show error if we have nothing cached to display.
      if (!cached) {
        setQuestions([]);
        toast({
          title: "Couldn't load questions",
          description: "Pull down to refresh or check your connection.",
          variant: "destructive",
        });
      }
    } else {
      const next = (data || []) as CourseQuestion[];
      questionsCache[courseId] = next;
      try { sessionStorage.setItem(SS_PREFIX + courseId, JSON.stringify(next)); } catch {}
      setQuestions(next);
    }
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const getQuestionByIndex = (index: number) => {
    return questions.find(q => q.question_index === index);
  };

  return { 
    questions, 
    isLoading, 
    error, 
    refetch: fetchQuestions,
    getQuestionByIndex,
    totalQuestions: questions.length 
  };
}
