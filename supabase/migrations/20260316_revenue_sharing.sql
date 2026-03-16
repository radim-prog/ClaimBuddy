-- TASK-011: Revenue sharing / priceback model for marketplace providers

-- Extend marketplace_providers with revenue sharing config
ALTER TABLE marketplace_providers
  ADD COLUMN IF NOT EXISTS revenue_share_pct NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS markup_pct NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'manual'
    CHECK (payout_method IN ('manual', 'bank_transfer', 'credit')),
  ADD COLUMN IF NOT EXISTS bank_account TEXT,
  ADD COLUMN IF NOT EXISTS payout_email TEXT;

-- Revenue transactions: every plugin usage that generates revenue
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What was used
  plugin_type TEXT NOT NULL CHECK (plugin_type IN ('extraction', 'travel_randomizer', 'ai_precounting')),
  resource_id TEXT, -- document_id, trip_id, etc.

  -- Financials (all in CZK * 100 = haléře for precision)
  base_price INT NOT NULL,       -- our base price
  markup_amount INT NOT NULL DEFAULT 0, -- provider's markup
  total_price INT NOT NULL,      -- what client pays = base + markup
  commission_amount INT NOT NULL, -- what provider earns = total * revenue_share_pct / 100
  platform_fee INT NOT NULL,     -- what we keep = total - commission

  period TEXT NOT NULL,           -- YYYY-MM
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'paid_out')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_tx_provider ON revenue_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tx_period ON revenue_transactions(period);
CREATE INDEX IF NOT EXISTS idx_revenue_tx_company ON revenue_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tx_status ON revenue_transactions(status);

-- Revenue payouts: monthly settlement records
CREATE TABLE IF NOT EXISTS revenue_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,

  period TEXT NOT NULL,              -- YYYY-MM
  total_transactions INT NOT NULL DEFAULT 0,
  total_revenue INT NOT NULL DEFAULT 0,    -- sum of total_price (haléře)
  commission_total INT NOT NULL DEFAULT 0, -- sum of commission_amount
  platform_fee_total INT NOT NULL DEFAULT 0,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT, -- bank transfer ref, invoice number, etc.
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(provider_id, period)
);

CREATE INDEX IF NOT EXISTS idx_revenue_payouts_status ON revenue_payouts(status);
CREATE INDEX IF NOT EXISTS idx_revenue_payouts_period ON revenue_payouts(period);

-- Plugin pricing config (editable by admin)
CREATE TABLE IF NOT EXISTS plugin_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_type TEXT NOT NULL UNIQUE,
  base_price_czk INT NOT NULL,        -- base price in haléře (e.g. 500 = 5 Kč)
  description TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default plugin prices
INSERT INTO plugin_pricing (plugin_type, base_price_czk, description) VALUES
  ('extraction', 500, 'Vytěžování dokumentu (OCR + AI)'),
  ('travel_randomizer', 1000, 'Generování knihy jízd z tankování'),
  ('ai_precounting', 300, 'AI předkontace dokladu')
ON CONFLICT (plugin_type) DO NOTHING;
