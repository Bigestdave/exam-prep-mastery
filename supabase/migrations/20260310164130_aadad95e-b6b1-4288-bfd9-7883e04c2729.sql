
-- Make pdf_url nullable so ambassadors can save courses without uploading files
ALTER TABLE public.course_uploads ALTER COLUMN pdf_url DROP NOT NULL;

-- Add modifier role to the enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'modifier';
