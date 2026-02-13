INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT '7b4dc934-2880-46b2-a9ba-c0f3497d9081', question_index, question_text, answer_text
FROM course_questions
WHERE course_id = '6a621245-4150-4e66-906e-f385f765c97e';