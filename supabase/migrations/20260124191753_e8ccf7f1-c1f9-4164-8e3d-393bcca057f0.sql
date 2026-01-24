-- Remove COS 101 from departments NOT in the approved COS 101 list
DELETE FROM courses 
WHERE code = 'COS 101' 
AND faculty IN (
  -- Engineering departments (all excluded)
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical & Electronics Engineering',
  'Computer Engineering',
  'Telecommunications Engineering',
  'Mechatronics Engineering',
  'Biomedical Engineering',
  'Information & Communication Engineering',
  'Wood Products Engineering',
  -- Agriculture departments
  'Agricultural Science',
  'Fisheries & Aquaculture',
  -- Health departments not in list
  'Community Health',
  'Health Information Science',
  -- ICT/Science departments not in list
  'Data Science',
  'Mathematics',
  'Statistics',
  -- Education departments (none have COS 101)
  'Biology Education',
  'Chemistry Education',
  'Physics Education',
  'Mathematics Education',
  -- Dental Surgery (not in approved list - only Dental Technology & Therapy)
  'Dental Surgery'
);