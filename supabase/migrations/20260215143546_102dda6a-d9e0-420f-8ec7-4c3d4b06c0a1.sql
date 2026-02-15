
-- Drop old IP-based constraint and add device-based tracking
ALTER TABLE public.active_sessions DROP CONSTRAINT IF EXISTS idx_active_sessions_user_ip;
DROP INDEX IF EXISTS idx_active_sessions_user_ip;

-- Add device_id column
ALTER TABLE public.active_sessions ADD COLUMN IF NOT EXISTS device_id text;

-- Make ip_address nullable (no longer primary tracking)
ALTER TABLE public.active_sessions ALTER COLUMN ip_address DROP NOT NULL;
ALTER TABLE public.active_sessions ALTER COLUMN ip_address SET DEFAULT 'unknown';

-- Unique constraint: one entry per user+device combo
CREATE UNIQUE INDEX idx_active_sessions_user_device ON public.active_sessions(user_id, device_id);

-- Clean existing data
TRUNCATE public.active_sessions;
