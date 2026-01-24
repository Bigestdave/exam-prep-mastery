-- Delete duplicate purchases, keeping only the earliest one
DELETE FROM purchases p1
USING purchases p2
WHERE p1.user_id = p2.user_id 
  AND p1.course_id = p2.course_id
  AND p1.created_at > p2.created_at;

-- Add unique constraint to prevent future duplicates
ALTER TABLE purchases ADD CONSTRAINT purchases_user_course_unique UNIQUE (user_id, course_id);