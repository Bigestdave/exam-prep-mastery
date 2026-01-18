-- Copy all questions from IRM 102 to LIS 102
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  '80d799ae-50c9-47a7-a2b0-57ab7f36721b' as course_id, -- LIS 102
  question_index,
  question_text,
  answer_text
FROM course_questions
WHERE course_id = '8d8fcc8b-3bdb-46b0-873e-9bd78b040a03'; -- IRM 102