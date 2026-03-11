UPDATE course_questions 
SET content = source.content
FROM course_questions source, courses tc
WHERE source.course_id = '06c6a316-2a02-4e55-a961-d8b959f89401'
  AND course_questions.course_id = tc.id
  AND tc.code = 'GST 107'
  AND course_questions.course_id != '06c6a316-2a02-4e55-a961-d8b959f89401'
  AND course_questions.question_index = source.question_index
  AND source.content IS NOT NULL