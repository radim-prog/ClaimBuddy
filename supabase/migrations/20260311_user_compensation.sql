-- Add compensation fields to users table for per-user cost tracking
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS compensation_type TEXT DEFAULT 'hourly'
    CHECK (compensation_type IN ('hourly', 'monthly')),
  ADD COLUMN IF NOT EXISTS compensation_amount NUMERIC(10,2) DEFAULT 0;
