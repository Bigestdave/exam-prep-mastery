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
      .eq('status', 'published')
      .order('question_index', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setQuestions([]);
      console.error('Failed to load questions:', fetchError);
      toast({
        title: "Couldn't load questions",
        description: "Pull down to refresh or check your connection.",
        variant: "destructive",
      });
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
