-- Delete user olabowaledavid@gmail.com (id: 55eb70c9-0e64-464b-8733-0a5df47ec921)
-- First delete from related tables, then from auth.users

-- Delete from purchases
DELETE FROM public.purchases WHERE user_id = '55eb70c9-0e64-464b-8733-0a5df47ec921';

-- Delete from user_roles
DELETE FROM public.user_roles WHERE user_id = '55eb70c9-0e64-464b-8733-0a5df47ec921';

-- Delete from profiles
DELETE FROM public.profiles WHERE id = '55eb70c9-0e64-464b-8733-0a5df47ec921';

-- Delete from auth.users
DELETE FROM auth.users WHERE id = '55eb70c9-0e64-464b-8733-0a5df47ec921';