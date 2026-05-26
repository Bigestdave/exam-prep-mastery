
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
  UNIQUE (question_id, quiz_index)
);

ALTER TABLE public.question_quizzes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Anyone can read quizzes'
  ) THEN
    CREATE POLICY "Anyone can read quizzes"
      ON public.question_quizzes
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can insert quizzes'
  ) THEN
    CREATE POLICY "Admins can insert quizzes"
      ON public.question_quizzes
      FOR INSERT
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can update quizzes'
  ) THEN
    CREATE POLICY "Admins can update quizzes"
      ON public.question_quizzes
      FOR UPDATE
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'question_quizzes'
      AND policyname = 'Admins can delete quizzes'
  ) THEN
    CREATE POLICY "Admins can delete quizzes"
      ON public.question_quizzes
      FOR DELETE
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_question_quizzes_question_id ON public.question_quizzes(question_id);
