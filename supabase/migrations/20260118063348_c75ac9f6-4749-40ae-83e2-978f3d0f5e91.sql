-- Standardize faculty names in courses
UPDATE courses SET faculty = 'Library & Information Science (LIS)' WHERE faculty = 'LIS';
UPDATE courses SET faculty = 'Information Resource Management (IRM)' WHERE faculty = 'IRM';

-- Standardize faculty names in profiles
UPDATE profiles SET faculty = 'Library & Information Science (LIS)' WHERE faculty = 'LIS';
UPDATE profiles SET faculty = 'Information Resource Management (IRM)' WHERE faculty = 'IRM';