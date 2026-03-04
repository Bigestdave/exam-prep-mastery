
-- Database function to safely credit ambassador wallet balance
CREATE OR REPLACE FUNCTION public.credit_ambassador_wallet(ambassador_id uuid, credit_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + credit_amount
  WHERE id = ambassador_id;
END;
$$;
