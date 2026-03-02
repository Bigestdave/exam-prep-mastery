
-- Propagate CHM 101 quiz_options from source course to all other CHM 101 departments
UPDATE course_questions cq
SET quiz_options = source.quiz_options
FROM (
  SELECT question_index, quiz_options 
  FROM course_questions 
  WHERE course_id = '0ce8e946-1d23-4681-b704-9165904045f6' 
    AND quiz_options IS NOT NULL
) source
WHERE cq.question_index = source.question_index
  AND cq.course_id IN (SELECT id FROM courses WHERE code = 'CHM 101')
  AND cq.quiz_options IS NULL;
