-- Delete orphan purchases where user no longer exists
DELETE FROM public.purchases 
WHERE user_id NOT IN (SELECT id FROM auth.users);