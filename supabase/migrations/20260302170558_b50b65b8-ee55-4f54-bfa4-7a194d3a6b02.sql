
-- ================================================
-- PHASE 1: Extend course_questions for AI content
-- ================================================

-- Structured AI-generated content (direct_answer, explanation, example, tldr)
ALTER TABLE public.course_questions 
ADD COLUMN IF NOT EXISTS structured_content jsonb;

-- Quiz MCQ options: [{"q": "...", "options": ["A","B","C","D"], "correct_index": 0}]
ALTER TABLE public.course_questions 
ADD COLUMN IF NOT EXISTS quiz_options jsonb;

-- ================================================
-- PHASE 2: Quiz attempts tracking
-- ================================================
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  percentage integer GENERATED ALWAYS AS (
    CASE WHEN total_questions > 0 THEN (score * 100 / total_questions) ELSE 0 END
  ) STORED,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
ON public.quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_quiz_attempts_user_course ON public.quiz_attempts(user_id, course_id);

-- ================================================
-- PHASE 3: Ambassador course upload pipeline
-- ================================================
CREATE TABLE public.course_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_code text NOT NULL,
  course_title text NOT NULL,
  department text NOT NULL,
  level text NOT NULL DEFAULT '100L',
  pdf_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  questions_generated integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads"
ON public.course_uploads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
ON public.course_uploads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads"
ON public.course_uploads FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update uploads"
ON public.course_uploads FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete uploads"
ON public.course_uploads FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_course_uploads_updated_at
BEFORE UPDATE ON public.course_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- PHASE 4: Storage bucket for course PDFs
-- ================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('course_materials', 'course_materials', true);

CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course_materials');

CREATE POLICY "Anyone can view course materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'course_materials');

CREATE POLICY "Admins can delete course materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'course_materials' AND public.has_role(auth.uid(), 'admin'));
