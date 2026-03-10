
-- Delete all IRM test uploads
DELETE FROM public.course_uploads WHERE department = 'Information Resources Management (IRM)';

-- Add unique constraint on course_code + department to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_uploads_code_dept ON public.course_uploads (course_code, department);
