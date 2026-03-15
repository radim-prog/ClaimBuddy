-- Tax questionnaires for client DPFO data collection
CREATE TABLE IF NOT EXISTS public.tax_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'reviewed')),
  responses JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  completed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, year)
);

CREATE INDEX idx_tax_questionnaires_company ON tax_questionnaires(company_id);
CREATE INDEX idx_tax_questionnaires_year ON tax_questionnaires(year);
CREATE INDEX idx_tax_questionnaires_status ON tax_questionnaires(status);
