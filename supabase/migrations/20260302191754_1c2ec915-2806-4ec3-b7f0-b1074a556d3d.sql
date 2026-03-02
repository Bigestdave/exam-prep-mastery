
UPDATE course_questions SET quiz_options = NULL
WHERE course_id IN (
  SELECT id FROM courses WHERE code IN ('CHM 101', 'PSY 101', 'GST 107', 'COS 101', 'MTH 101')
);
