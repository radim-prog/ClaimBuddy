-- accounting_firms: Central tenant entity for accounting firms
CREATE TABLE IF NOT EXISTS accounting_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ico TEXT,                          -- IČO
  dic TEXT,                          -- DIČ
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB DEFAULT '{}',        -- {street, city, zip, region}
  logo_url TEXT,

  -- Subscription/billing
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise')),
  stripe_customer_id TEXT,
  billing_email TEXT,

  -- Settings
  signi_api_key TEXT,                -- Encrypted, shared firm-level Signi key
  google_drive_credentials JSONB,    -- {client_id, client_secret, refresh_token, root_folder_id}
  settings JSONB DEFAULT '{}',       -- Extensible firm settings

  -- Marketplace link
  marketplace_provider_id UUID REFERENCES marketplace_providers(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'cancelled')),
  onboarded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link users to firms
ALTER TABLE users ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

-- Link companies to firms (which accounting firm manages this company)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

-- Link signing_templates to firms (shared template library)
ALTER TABLE signing_templates ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounting_firms_status ON accounting_firms(status);
CREATE INDEX IF NOT EXISTS idx_accounting_firms_ico ON accounting_firms(ico) WHERE ico IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_firm_id ON users(firm_id) WHERE firm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_firm_id ON companies(firm_id) WHERE firm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signing_templates_firm_id ON signing_templates(firm_id) WHERE firm_id IS NOT NULL;

-- Auto-create firm for existing admin user (Radim = super-admin)
-- This is a bootstrap: the first firm is the platform operator
INSERT INTO accounting_firms (name, ico, status, onboarded_at)
VALUES ('Zajcon Accounting', '12345678', 'active', now())
ON CONFLICT DO NOTHING;
