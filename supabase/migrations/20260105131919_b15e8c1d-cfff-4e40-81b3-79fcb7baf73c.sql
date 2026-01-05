-- Copy questions from original LIS 104 (IRM) to Mass Communication version
INSERT INTO public.course_questions (course_id, question_index, question_text, answer_text)
SELECT 'd9f64fed-c7f3-430b-8a74-772be3b7cbd4'::uuid, question_index, question_text, answer_text
FROM public.course_questions
WHERE course_id = 'e4a37d28-9a6e-449a-803c-83aefe77b48f';

-- Copy questions from original LIS 104 (IRM) to Library & Information Science version
INSERT INTO public.course_questions (course_id, question_index, question_text, answer_text)
SELECT '17875b14-87b4-457a-9bd4-fcc6811f0c81'::uuid, question_index, question_text, answer_text
FROM public.course_questions
WHERE course_id = 'e4a37d28-9a6e-449a-803c-83aefe77b48f';