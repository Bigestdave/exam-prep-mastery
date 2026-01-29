-- Delete related records for user olabowaledavid@gmail.com (2edecadb-e86d-4574-9157-954af110e524)
-- This must be done before the user can be deleted from auth.users

DELETE FROM public.purchases WHERE user_id = '2edecadb-e86d-4574-9157-954af110e524';
DELETE FROM public.user_roles WHERE user_id = '2edecadb-e86d-4574-9157-954af110e524';
DELETE FROM public.profiles WHERE id = '2edecadb-e86d-4574-9157-954af110e524';