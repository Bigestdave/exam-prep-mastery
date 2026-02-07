
-- Fix naming mismatch: "English and Literary Studies" → "English & Literary Studies"
UPDATE courses 
SET faculty = 'English & Literary Studies' 
WHERE faculty = 'English and Literary Studies';
