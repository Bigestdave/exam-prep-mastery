
-- Add wallet_balance to profiles for ambassador rewards
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance integer NOT NULL DEFAULT 0;

-- Allow service role (n8n) to update course_uploads status
-- Already has admin update policy, but n8n uses service_role which bypasses RLS, so no change needed
