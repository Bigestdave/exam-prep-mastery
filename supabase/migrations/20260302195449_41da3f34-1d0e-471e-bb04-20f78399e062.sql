
-- Add 'ambassador' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ambassador';

-- Allow ambassadors to view their own role
-- (existing policy "Users can view their own roles" already covers this)

-- Allow admins to query profiles for ambassador management (they can already via RLS)
