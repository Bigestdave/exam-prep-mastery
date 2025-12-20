-- Create course_questions table to store questions separately with proper access control
CREATE TABLE public.course_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    question_index INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(course_id, question_index)
);

-- Enable RLS on course_questions
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

-- Function to check if user has purchased a course
CREATE OR REPLACE FUNCTION public.has_purchased_course(course_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.purchases
    WHERE user_id = auth.uid()
      AND purchases.course_id = $1::text
  )
$$;

-- Policy: Users can view questions only if they purchased the course OR it's the first question (free preview)
CREATE POLICY "Users can view purchased course questions"
ON public.course_questions
FOR SELECT
USING (
  has_purchased_course(course_id) OR question_index = 0
);

-- Policy: Only admins can insert questions
CREATE POLICY "Admins can insert course questions"
ON public.course_questions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can update questions
CREATE POLICY "Admins can update course questions"
ON public.course_questions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete questions
CREATE POLICY "Admins can delete course questions"
ON public.course_questions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_course_questions_updated_at
BEFORE UPDATE ON public.course_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing questions from courses table to course_questions
DO $$
DECLARE
    course_rec RECORD;
    question_rec RECORD;
    idx INTEGER;
BEGIN
    FOR course_rec IN SELECT id, questions FROM public.courses WHERE questions IS NOT NULL AND questions != '[]'::jsonb
    LOOP
        idx := 0;
        FOR question_rec IN SELECT * FROM jsonb_array_elements(course_rec.questions)
        LOOP
            INSERT INTO public.course_questions (course_id, question_index, question_text, answer_text)
            VALUES (
                course_rec.id,
                idx,
                question_rec.value->>'q',
                question_rec.value->>'a'
            )
            ON CONFLICT (course_id, question_index) DO NOTHING;
            idx := idx + 1;
        END LOOP;
    END LOOP;
END $$;

-- Remove questions column from courses table (after migration)
ALTER TABLE public.courses DROP COLUMN IF EXISTS questions;