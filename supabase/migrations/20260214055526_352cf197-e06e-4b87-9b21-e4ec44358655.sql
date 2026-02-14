
-- Create COS 101 for Criminology & Security Studies
INSERT INTO courses (code, title, faculty, level, price)
VALUES ('COS 101', 'Introduction to Computer Science', 'Criminology & Security Studies', '100L', 1000);

-- Copy questions from an existing COS 101 (Geology)
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  (SELECT id FROM courses WHERE code = 'COS 101' AND faculty = 'Criminology & Security Studies'),
  question_index, question_text, answer_text
FROM course_questions
WHERE course_id = '5eb1de08-82f9-4983-930e-0837a64c8890';
