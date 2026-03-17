-- Link signing_jobs to insurance_cases for PU (Pojistné Události) contracts
ALTER TABLE signing_jobs ADD COLUMN IF NOT EXISTS insurance_case_id UUID REFERENCES insurance_cases(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_signing_jobs_insurance_case ON signing_jobs(insurance_case_id) WHERE insurance_case_id IS NOT NULL;

-- Category for signing templates (general vs insurance)
ALTER TABLE signing_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'
  CHECK (category IN ('general', 'insurance'));
