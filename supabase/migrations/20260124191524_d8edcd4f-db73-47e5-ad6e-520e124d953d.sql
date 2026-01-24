-- Remove COS 101 from IRM, Mass Communication, and LIS departments
DELETE FROM courses 
WHERE code = 'COS 101' 
AND faculty IN (
  'Information Resources Management (IRM)', 
  'Mass Communication & Media Studies', 
  'Library & Information Science'
);