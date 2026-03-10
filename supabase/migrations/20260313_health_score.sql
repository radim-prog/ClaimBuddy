-- Add health score columns to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_score_breakdown JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_score_updated_at TIMESTAMPTZ DEFAULT NULL;
