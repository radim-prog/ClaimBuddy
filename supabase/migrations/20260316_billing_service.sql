-- Billing-as-a-service: accountant sets prices, platform collects, pays out accountant
-- No Stripe Connect — platform collects all payments, tracks payouts internally

-- Billing configs: per-company monthly fee set by accountant
CREATE TABLE IF NOT EXISTS billing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  accountant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Pricing
  monthly_fee INT NOT NULL, -- Kc per month
  currency TEXT NOT NULL DEFAULT 'CZK',

  -- Stripe
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_customer_id TEXT, -- client's Stripe customer ID

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'cancelled', 'suspended')),
  activated_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,

  -- Fee
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- platform takes 10% by default

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(company_id) -- one billing config per company
);

-- Billing invoices: monthly records of what was charged
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_config_id UUID NOT NULL REFERENCES billing_configs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  period TEXT NOT NULL, -- 'YYYY-MM'
  amount INT NOT NULL, -- gross amount in Kc
  platform_fee INT NOT NULL, -- platform fee in Kc
  accountant_payout INT NOT NULL, -- amount - fee

  -- Payment status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'overdue', 'refunded', 'waived')),
  stripe_invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  due_date DATE NOT NULL,

  -- Dunning
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  escalated BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(billing_config_id, period)
);

-- Payout records: tracking what platform owes to accountants
CREATE TABLE IF NOT EXISTS billing_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  period TEXT NOT NULL, -- 'YYYY-MM'
  total_collected INT NOT NULL DEFAULT 0, -- total gross from all clients
  total_fee INT NOT NULL DEFAULT 0, -- total platform fee
  total_payout INT NOT NULL DEFAULT 0, -- net payout to accountant

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT, -- bank transfer reference

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(accountant_user_id, period)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_configs_accountant ON billing_configs(accountant_user_id);
CREATE INDEX IF NOT EXISTS idx_billing_configs_status ON billing_configs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_billing_invoices_period ON billing_invoices(period);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_status ON billing_invoices(status) WHERE status IN ('pending', 'overdue', 'failed');
CREATE INDEX IF NOT EXISTS idx_billing_payouts_accountant ON billing_payouts(accountant_user_id);
