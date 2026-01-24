-- Create a function to get question counts per course efficiently
CREATE OR REPLACE FUNCTION public.get_course_question_counts(p_course_ids uuid[])
RETURNS TABLE(course_id uuid, question_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    cq.course_id,
    COUNT(*)::bigint as question_count
  FROM public.course_questions cq
  WHERE cq.course_id = ANY(p_course_ids)
  GROUP BY cq.course_id;
$$;