
-- Semester configuration for admin control
CREATE TABLE public.semester_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.semester_config ENABLE ROW LEVEL SECURITY;

-- Only one active semester at a time
CREATE UNIQUE INDEX idx_semester_config_active ON public.semester_config (is_active) WHERE is_active = true;

CREATE POLICY "Anyone can view active semester" ON public.semester_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage semesters" ON public.semester_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Department milestones tracking
CREATE TABLE public.department_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  semester_id uuid REFERENCES public.semester_config(id) ON DELETE CASCADE NOT NULL,
  tier integer NOT NULL CHECK (tier IN (1, 2, 3)),
  ambassador_id uuid NOT NULL,
  bonus_amount integer NOT NULL,
  achieved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department, semester_id, tier)
);

ALTER TABLE public.department_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage milestones" ON public.department_milestones FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Ambassadors can view own milestones" ON public.department_milestones FOR SELECT USING (auth.uid() = ambassador_id);
CREATE POLICY "Anyone can view milestones" ON public.department_milestones FOR SELECT USING (true);

-- RPC: Get department performance stats for a given semester
-- Returns unique buyers, total unlocks, avg courses per buyer per department
CREATE OR REPLACE FUNCTION public.get_department_stats(p_since timestamptz DEFAULT '2020-01-01'::timestamptz)
RETURNS TABLE(
  department text,
  unique_buyers bigint,
  total_unlocks bigint,
  avg_per_buyer numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.faculty AS department,
    COUNT(DISTINCT p.user_id) AS unique_buyers,
    COUNT(*)::bigint AS total_unlocks,
    ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT p.user_id), 0), 1) AS avg_per_buyer
  FROM purchases p
  JOIN courses c ON c.id::text = p.course_id
  WHERE p.created_at >= p_since
  GROUP BY c.faculty
  ORDER BY total_unlocks DESC;
$$;

-- RPC: Get leaderboard of departments ranked by unique buyers
CREATE OR REPLACE FUNCTION public.get_department_leaderboard(p_since timestamptz DEFAULT '2020-01-01'::timestamptz)
RETURNS TABLE(
  department text,
  unique_buyers bigint,
  total_unlocks bigint,
  avg_per_buyer numeric,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    department,
    unique_buyers,
    total_unlocks,
    avg_per_buyer,
    ROW_NUMBER() OVER (ORDER BY unique_buyers DESC) AS rank
  FROM public.get_department_stats(p_since) AS stats;
$$;

-- Insert a default active semester
INSERT INTO public.semester_config (name, is_active)
VALUES ('2024/2025 Second Semester', true);
