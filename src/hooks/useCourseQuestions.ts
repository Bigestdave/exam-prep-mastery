import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CourseQuestion {
  id: string;
  course_id: string;
  question_index: number;
  question_text: string;
  answer_text: string;
}

export function useCourseQuestions(courseId: string | undefined) {
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!courseId) {
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('course_questions')
      .select('*')
      .eq('course_id', courseId)
      .order('question_index', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setQuestions([]);
    } else {
      setQuestions(data || []);
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
