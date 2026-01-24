-- Remove all GST 106 and GST 107 courses (no tutorial questions available)
DELETE FROM courses WHERE code IN ('GST 106', 'GST 107');