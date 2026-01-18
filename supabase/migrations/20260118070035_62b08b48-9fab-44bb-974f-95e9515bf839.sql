-- Copy all questions from IRM 103 (666eeaa5-fd9e-4104-b3fc-5ffde1b5c234) to LIS 101 (add90f02-c98b-4fb7-9fcc-bfe3008df822)
-- First delete any existing questions in LIS 101
DELETE FROM course_questions WHERE course_id = 'add90f02-c98b-4fb7-9fcc-bfe3008df822';

-- Then copy all questions from IRM 103 to LIS 101
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  'add90f02-c98b-4fb7-9fcc-bfe3008df822' as course_id,
  question_index,
  question_text,
  answer_text
FROM course_questions
WHERE course_id = '666eeaa5-fd9e-4104-b3fc-5ffde1b5c234'
ORDER BY question_index;