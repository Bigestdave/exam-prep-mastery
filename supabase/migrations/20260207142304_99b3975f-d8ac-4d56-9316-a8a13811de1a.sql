INSERT INTO courses (code, title, faculty, level, price)
SELECT 'GST 106', 'Personal Health', faculty, '100L', 1000
FROM courses
WHERE code = 'GST 107';