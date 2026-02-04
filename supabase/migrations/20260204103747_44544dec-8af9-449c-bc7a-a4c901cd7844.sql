-- Fix GST 107 to use 100L format to match other courses
UPDATE public.courses SET level = '100L' WHERE code = 'GST 107';

-- Revert profiles back to 100L format
UPDATE public.profiles SET level = '100L' WHERE level = '100 Level'