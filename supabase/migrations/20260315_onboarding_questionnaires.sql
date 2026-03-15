-- Onboarding questionnaires — client-facing intake form
CREATE TABLE IF NOT EXISTS onboarding_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'reviewed')),
  responses JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_questionnaires_company ON onboarding_questionnaires(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_questionnaires_status ON onboarding_questionnaires(status);
