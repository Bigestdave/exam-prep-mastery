
CREATE OR REPLACE FUNCTION public.get_courses_with_quizzes(p_course_ids uuid[])
RETURNS TABLE(course_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT DISTINCT cq.course_id
  FROM public.course_questions cq
  WHERE cq.course_id = ANY(p_course_ids)
    AND (
      -- Check content JSONB for quiz or quizzes keys
      cq.content ? 'quiz'
      OR cq.content ? 'quizzes'
      -- Check structured_content JSONB for quiz or quizzes keys
      OR cq.structured_content ? 'quiz'
      OR cq.structured_content ? 'quizzes'
      -- Check legacy quiz_options column
      OR (cq.quiz_options IS NOT NULL AND cq.quiz_options::text != 'null' AND cq.quiz_options::text != '[]')
    );
$$;
