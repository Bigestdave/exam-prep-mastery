-- Add status column to course_questions (existing rows default to 'published')
ALTER TABLE public.course_questions 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_course_questions_status ON public.course_questions(status);