-- Monthly payments tracking
CREATE TABLE monthly_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,            -- 'YYYY-MM'
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, period)
);

CREATE INDEX idx_monthly_payments_period ON monthly_payments(period);

-- Company groups with billing entity
CREATE TABLE company_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL UNIQUE,
  billing_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed from existing group_name values
INSERT INTO company_groups (group_name, billing_company_id)
SELECT DISTINCT group_name, NULL
FROM companies
WHERE group_name IS NOT NULL AND group_name != '';
