ALTER TABLE public.course_questions
ADD COLUMN IF NOT EXISTS explanation_text text,
ADD COLUMN IF NOT EXISTS key_points jsonb,
ADD COLUMN IF NOT EXISTS exam_tip text,
ADD COLUMN IF NOT EXISTS answer_confidence double precision;

ALTER TABLE public.course_questions
ALTER COLUMN answer_confidence SET DEFAULT 0.65;

CREATE TABLE IF NOT EXISTS public.question_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.course_questions(id) ON DELETE CASCADE,
  quiz_index integer NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation_text text,
  hint_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_quizzes_question_id_quiz_index_key UNIQUE (question_id, quiz_index)
);

CREATE INDEX IF NOT EXISTS idx_question_quizzes_question_id
ON public.question_quizzes(question_id);

ALTER TABLE public.question_quizzes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Users can view accessible question quizzes'
  ) THEN
    CREATE POLICY "Users can view accessible question quizzes"
    ON public.question_quizzes
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.course_questions cq
        WHERE cq.id = question_id
          AND (
            public.has_purchased_course(cq.course_id)
            OR cq.question_index = 0
          )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can insert question quizzes'
  ) THEN
    CREATE POLICY "Admins can insert question quizzes"
    ON public.question_quizzes
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can update question quizzes'
  ) THEN
    CREATE POLICY "Admins can update question quizzes"
    ON public.question_quizzes
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can delete question quizzes'
  ) THEN
    CREATE POLICY "Admins can delete question quizzes"
    ON public.question_quizzes
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_question_quizzes_updated_at ON public.question_quizzes;
CREATE TRIGGER update_question_quizzes_updated_at
BEFORE UPDATE ON public.question_quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

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
      EXISTS (
        SELECT 1
        FROM public.question_quizzes qq
        WHERE qq.question_id = cq.id
      )
      OR cq.content ? 'quiz'
      OR cq.content ? 'quizzes'
      OR cq.structured_content ? 'quiz'
      OR cq.structured_content ? 'quizzes'
      OR (cq.quiz_options IS NOT NULL AND cq.quiz_options::text != 'null' AND cq.quiz_options::text != '[]')
    );
$$;
