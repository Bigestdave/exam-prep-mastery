
-- Referrals table: tracks who referred whom
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, converted (purchase made), credited
  credited_amount integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE(referred_id) -- a user can only be referred once
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Ambassadors can see their own referrals
CREATE POLICY "Users can view own referrals as referrer"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can view their own referral record
CREATE POLICY "Users can view own referred record"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts (via edge functions) - no INSERT policy needed for anon
-- We'll handle inserts via edge functions with service role

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, paid, rejected
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own withdrawal requests
CREATE POLICY "Users can insert own withdrawal requests"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update withdrawal requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add referral_code column to profiles for easy lookup
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
