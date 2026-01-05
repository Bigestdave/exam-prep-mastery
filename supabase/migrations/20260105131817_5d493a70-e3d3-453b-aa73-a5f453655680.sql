-- Drop the unique constraint on course code to allow same course for multiple departments
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_code_key;

-- Add a composite unique constraint on code + faculty instead
ALTER TABLE public.courses ADD CONSTRAINT courses_code_faculty_unique UNIQUE (code, faculty);