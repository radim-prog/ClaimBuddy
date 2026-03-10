-- Revenue Growth Tracker: revenue_goals + client_events tables

-- Revenue goals per year
CREATE TABLE IF NOT EXISTS revenue_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  annual_revenue_target NUMERIC NOT NULL,
  monthly_targets JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(year)
);

-- Client lifecycle events (onboarding, churn, fee changes)
CREATE TABLE IF NOT EXISTS client_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('onboarded', 'churned', 'paused', 'fee_changed')),
  event_date DATE NOT NULL,
  monthly_fee NUMERIC,
  previous_fee NUMERIC,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_client_events_company ON client_events(company_id);
CREATE INDEX IF NOT EXISTS idx_client_events_date ON client_events(event_date);
CREATE INDEX IF NOT EXISTS idx_client_events_type ON client_events(event_type);
CREATE INDEX IF NOT EXISTS idx_revenue_goals_year ON revenue_goals(year);
