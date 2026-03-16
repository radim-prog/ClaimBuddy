-- TASK-012: Billing-as-a-service — accounts receivable for marketplace providers

-- Per-client billing configuration (accountant sets monthly fee per client)
CREATE TABLE IF NOT EXISTS client_billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  monthly_fee_czk INT NOT NULL,          -- in haléře (e.g. 500000 = 5000 Kč)
  platform_fee_pct NUMERIC(5,2) DEFAULT 5.00, -- platform cut percentage
  billing_day INT DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider_id, company_id)
);

-- Monthly billing cycles — one row per client per month
CREATE TABLE IF NOT EXISTS billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES client_billing_config(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                   -- YYYY-MM
  amount_due INT NOT NULL,               -- haléře
  platform_fee INT NOT NULL,             -- haléře (our cut)
  provider_payout INT NOT NULL,          -- haléře = amount_due - platform_fee
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'written_off')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  escalation_level INT NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_id, period)
);

CREATE INDEX IF NOT EXISTS idx_billing_config_provider ON client_billing_config(provider_id);
CREATE INDEX IF NOT EXISTS idx_billing_config_company ON client_billing_config(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON billing_cycles(status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_period ON billing_cycles(period);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_provider ON billing_cycles(provider_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_overdue ON billing_cycles(due_date) WHERE status IN ('pending', 'overdue');
