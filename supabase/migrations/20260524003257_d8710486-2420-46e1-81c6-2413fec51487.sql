-- Semester reset: wipe course catalog and questions, keep purchase/quiz history
DELETE FROM public.course_questions;
DELETE FROM public.course_uploads;
DELETE FROM public.courses;