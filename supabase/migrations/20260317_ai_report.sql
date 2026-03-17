-- Add AI report columns to insurance_cases
ALTER TABLE insurance_cases
  ADD COLUMN IF NOT EXISTS ai_report TEXT,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- Add 'ai_processing' to service_mode check if constraint exists
-- (safe to run multiple times)
DO $$
BEGIN
  -- Drop old constraint if exists, re-create with new value
  ALTER TABLE insurance_cases DROP CONSTRAINT IF EXISTS insurance_cases_service_mode_check;
  ALTER TABLE insurance_cases ADD CONSTRAINT insurance_cases_service_mode_check
    CHECK (service_mode IN ('self_service', 'consultation', 'full_representation', 'ai_processing'));
EXCEPTION WHEN OTHERS THEN
  -- No constraint to update — that's fine
  NULL;
END $$;
