-- Onboarding pipeline for accounting firm client acquisition
CREATE TABLE IF NOT EXISTS onboarding_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  ico TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  expected_monthly_fee NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'onboarding', 'planned', 'active')),
  note TEXT,
  source TEXT,  -- how we found them (referral, web, cold call...)
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,  -- link once they become a real company
  planned_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_pipeline_stage ON onboarding_pipeline(stage);

-- RLS off (service_role only via API)
ALTER TABLE onboarding_pipeline ENABLE ROW LEVEL SECURITY;
