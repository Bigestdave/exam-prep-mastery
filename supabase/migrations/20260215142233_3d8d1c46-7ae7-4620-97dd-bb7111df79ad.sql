
-- Table to track active user sessions with IP addresses
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text NOT NULL,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups by user
CREATE INDEX idx_active_sessions_user_id ON public.active_sessions(user_id);

-- Unique constraint: one entry per user+IP combo
CREATE UNIQUE INDEX idx_active_sessions_user_ip ON public.active_sessions(user_id, ip_address);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.active_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Only the track-session edge function (via service role) manages sessions
-- No direct insert/update/delete for regular users

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.active_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete sessions
CREATE POLICY "Admins can delete sessions"
ON public.active_sessions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
