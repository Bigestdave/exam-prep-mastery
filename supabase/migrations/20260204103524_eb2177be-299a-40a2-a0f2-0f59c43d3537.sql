-- Fix all user profiles that use "100L" format to match the standard "100 Level" format
UPDATE public.profiles 
SET level = '100 Level' 
WHERE level = '100L'