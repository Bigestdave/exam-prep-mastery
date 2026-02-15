
-- Add PSY 101 to Office and Information Management
INSERT INTO courses (code, title, faculty, level, price)
VALUES ('PSY 101', 'Introduction to Psychology', 'Office and Information Management', '100L', 1000);

-- Add LIS 104 to Office and Information Management
INSERT INTO courses (code, title, faculty, level, price)
VALUES ('LIS 104', 'Information Architecture', 'Office and Information Management', '100L', 1000);

-- Add ACC 101 to Office and Information Management
INSERT INTO courses (code, title, faculty, level, price)
VALUES ('ACC 101', 'Introduction to Financial Accounting', 'Office and Information Management', '100L', 1000);

-- Copy PSY 101 questions from Criminology & Security Studies
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  (SELECT id FROM courses WHERE code = 'PSY 101' AND faculty = 'Office and Information Management'),
  question_index, question_text, answer_text
FROM course_questions
WHERE course_id = '7e3deb81-ffb7-43d8-be88-000d57981998';

-- Copy LIS 104 questions from Library & Information Science
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  (SELECT id FROM courses WHERE code = 'LIS 104' AND faculty = 'Office and Information Management'),
  question_index, question_text, answer_text
FROM course_questions
WHERE course_id = '17875b14-87b4-457a-9bd4-fcc6811f0c81';

-- Copy ACC 101 questions from Accounting
INSERT INTO course_questions (course_id, question_index, question_text, answer_text)
SELECT 
  (SELECT id FROM courses WHERE code = 'ACC 101' AND faculty = 'Office and Information Management'),
  question_index, question_text, answer_text
FROM course_questions
WHERE course_id = 'ee0c8efb-d161-4421-a7c7-a655668e7a70';
