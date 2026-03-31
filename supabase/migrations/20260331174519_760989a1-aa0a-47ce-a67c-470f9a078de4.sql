CREATE OR REPLACE FUNCTION public.get_department_leaderboard(p_since timestamptz DEFAULT '2020-01-01T00:00:00Z')
RETURNS TABLE(
  department text,
  unique_buyers bigint,
  total_unlocks bigint,
  avg_per_buyer numeric,
  rank bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    department,
    unique_buyers,
    total_unlocks,
    avg_per_buyer,
    ROW_NUMBER() OVER (ORDER BY total_unlocks DESC) AS rank
  FROM public.get_department_stats(p_since) AS stats;
$$;