-- Update courses table faculty names to match taxonomy
UPDATE courses SET faculty = 'Nursing Science' WHERE faculty = 'Nursing';
UPDATE courses SET faculty = 'Medicine & Surgery (MBBS)' WHERE faculty = 'Medicine (MBBS)';
UPDATE courses SET faculty = 'Dentistry (BDS)' WHERE faculty = 'Dentistry';
UPDATE courses SET faculty = 'Pharmacy (Pharm.D)' WHERE faculty = 'Pharmacy';
UPDATE courses SET faculty = 'Environmental Health Science' WHERE faculty = 'Environmental Health Science (EHS)';
UPDATE courses SET faculty = 'Health Information Management' WHERE faculty = 'Health Information Management (HIM)';
UPDATE courses SET faculty = 'Physics with Electronics' WHERE faculty = 'Physics';
UPDATE courses SET faculty = 'Information Resources Management (IRM)' WHERE faculty = 'Information Resource Management (IRM)';
UPDATE courses SET faculty = 'Mass Communication & Media Studies' WHERE faculty = 'Mass Communication';
UPDATE courses SET faculty = 'Library & Information Science' WHERE faculty = 'Library & Information Science (LIS)';
UPDATE courses SET faculty = 'LL.B Law' WHERE faculty = 'Law';
UPDATE courses SET faculty = 'Radiography & Radiation Science' WHERE faculty = 'Radiography';

-- Update profiles table faculty names to match taxonomy (for existing users)
UPDATE profiles SET faculty = 'Information Resources Management (IRM)' WHERE faculty = 'Information Resource Management (IRM)';
UPDATE profiles SET faculty = 'Mass Communication & Media Studies' WHERE faculty = 'Mass Communication';
UPDATE profiles SET faculty = 'Library & Information Science' WHERE faculty = 'Library & Information Science (LIS)';