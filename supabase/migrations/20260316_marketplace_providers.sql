-- TASK-010a: Marketplace providers — účetní firmy v marketplace

CREATE TABLE IF NOT EXISTS marketplace_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Základní údaje
  name TEXT NOT NULL,
  ico TEXT NOT NULL,
  dic TEXT,
  legal_form TEXT,

  -- Kontakt
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,

  -- Lokalita
  street TEXT,
  city TEXT NOT NULL,
  zip TEXT,
  region TEXT,

  -- Marketplace profil
  description TEXT, -- volný popis firmy
  specializations TEXT[] DEFAULT '{}', -- pole specializací
  capacity_status TEXT NOT NULL DEFAULT 'accepting'
    CHECK (capacity_status IN ('accepting', 'limited', 'full')),
  min_price INT, -- od (Kč/měs)
  max_price INT, -- do (Kč/měs)

  -- Služby
  services TEXT[] DEFAULT '{}', -- účetnictví, mzdy, daně, poradenství...

  -- Verifikace
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,

  -- Metadata
  logo_url TEXT,
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(ico),
  UNIQUE(company_id)
);

CREATE INDEX IF NOT EXISTS idx_mp_status ON marketplace_providers(status);
CREATE INDEX IF NOT EXISTS idx_mp_city ON marketplace_providers(city) WHERE status = 'verified';
CREATE INDEX IF NOT EXISTS idx_mp_capacity ON marketplace_providers(capacity_status) WHERE status = 'verified';
