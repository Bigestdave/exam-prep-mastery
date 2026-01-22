-- Delete all related data first
DELETE FROM public.purchases WHERE user_id = '87fcd9ff-2921-4c38-8c4d-06a515d34587';
DELETE FROM public.user_roles WHERE user_id = '87fcd9ff-2921-4c38-8c4d-06a515d34587';
DELETE FROM public.profiles WHERE id = '87fcd9ff-2921-4c38-8c4d-06a515d34587';

-- Delete from auth.users
DELETE FROM auth.users WHERE id = '87fcd9ff-2921-4c38-8c4d-06a515d34587';