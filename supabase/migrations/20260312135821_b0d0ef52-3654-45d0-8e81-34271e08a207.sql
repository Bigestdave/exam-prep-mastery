
CREATE TABLE public.ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ambassador_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (apply)
CREATE POLICY "Anyone can apply" ON public.ambassador_applications
  FOR INSERT TO public
  WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view applications" ON public.ambassador_applications
  FOR SELECT TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update applications
CREATE POLICY "Admins can update applications" ON public.ambassador_applications
  FOR UPDATE TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view own application by email (optional)
CREATE POLICY "Admins can delete applications" ON public.ambassador_applications
  FOR DELETE TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
