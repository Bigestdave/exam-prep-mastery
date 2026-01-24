-- First delete from profiles (which references auth.users)
DELETE FROM profiles WHERE id = 'fe4b528b-9122-4f62-a676-dcd2c8c4558e';

-- Delete any purchases
DELETE FROM purchases WHERE user_id = 'fe4b528b-9122-4f62-a676-dcd2c8c4558e';

-- Delete any user roles
DELETE FROM user_roles WHERE user_id = 'fe4b528b-9122-4f62-a676-dcd2c8c4558e';

-- Finally delete from auth.users
DELETE FROM auth.users WHERE email = 'olabowaledavid@gmail.com';