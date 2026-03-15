-- ============================================
-- Dohodari module: DPP/DPC agreements management
-- ============================================

-- 1. Main agreements table
CREATE TABLE IF NOT EXISTS dohody (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Agreement type & terms
  typ TEXT NOT NULL CHECK (typ IN ('dpp', 'dpc')),
  popis_prace TEXT NOT NULL DEFAULT '',          -- job description
  misto_vykonu TEXT DEFAULT '',                  -- place of work
  sazba NUMERIC(10,2) NOT NULL DEFAULT 0,       -- hourly rate CZK
  max_hodin_rok INT DEFAULT 300,                 -- max hours/year (DPP=300, DPC=calculated)
  platnost_od DATE NOT NULL,
  platnost_do DATE,                              -- null = indefinite

  -- Tax declaration
  prohlaseni_podepsano BOOLEAN DEFAULT false,
  prohlaseni_datum DATE,

  -- Signature tracking
  podpis_zamestnavatel BOOLEAN DEFAULT false,
  podpis_zamestnanec BOOLEAN DEFAULT false,
  podpis_datum DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'terminated', 'expired')),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Monthly timesheets & payroll
CREATE TABLE IF NOT EXISTS dohoda_mesice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dohoda_id UUID NOT NULL REFERENCES dohody(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Period
  period TEXT NOT NULL,                           -- 'YYYY-MM'
  hodiny NUMERIC(6,2) NOT NULL DEFAULT 0,         -- hours worked

  -- Payroll calculation
  hruba_mzda NUMERIC(12,2) NOT NULL DEFAULT 0,
  socialni_zamestnanec NUMERIC(10,2) DEFAULT 0,
  socialni_zamestnavatel NUMERIC(10,2) DEFAULT 0,
  zdravotni_zamestnanec NUMERIC(10,2) DEFAULT 0,
  zdravotni_zamestnavatel NUMERIC(10,2) DEFAULT 0,
  typ_dane TEXT DEFAULT 'srazkova' CHECK (typ_dane IN ('srazkova', 'zalohova')),
  dan NUMERIC(10,2) DEFAULT 0,
  sleva_poplatnik NUMERIC(10,2) DEFAULT 0,
  cista_mzda NUMERIC(12,2) NOT NULL DEFAULT 0,
  naklady_zamestnavatel NUMERIC(12,2) DEFAULT 0,  -- total employer cost

  -- Payment tracking
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
  payment_date DATE,
  payment_method TEXT DEFAULT 'bank' CHECK (payment_method IN ('bank', 'cash', 'other')),

  -- Vykaz status
  vykaz_status TEXT DEFAULT 'draft' CHECK (vykaz_status IN ('draft', 'confirmed', 'locked')),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(dohoda_id, period)
);

-- 3. Agreement documents (PDFs, signed copies)
CREATE TABLE IF NOT EXISTS dohoda_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dohoda_id UUID NOT NULL REFERENCES dohody(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  doc_type TEXT NOT NULL CHECK (doc_type IN ('dohoda', 'prohlaseni', 'potvrzeni_prijmu', 'vykaz_prace')),
  generated_url TEXT,                             -- URL to generated PDF
  signed_url TEXT,                                -- URL to signed copy
  period TEXT,                                    -- for period-specific docs (vykaz, potvrzeni)
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'signed', 'archived')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_dohody_company ON dohody(company_id);
CREATE INDEX IF NOT EXISTS idx_dohody_employee ON dohody(employee_id);
CREATE INDEX IF NOT EXISTS idx_dohody_status ON dohody(status);
CREATE INDEX IF NOT EXISTS idx_dohoda_mesice_dohoda ON dohoda_mesice(dohoda_id);
CREATE INDEX IF NOT EXISTS idx_dohoda_mesice_company ON dohoda_mesice(company_id);
CREATE INDEX IF NOT EXISTS idx_dohoda_mesice_period ON dohoda_mesice(period);
CREATE INDEX IF NOT EXISTS idx_dohoda_mesice_payment ON dohoda_mesice(payment_status);
CREATE INDEX IF NOT EXISTS idx_dohoda_documents_dohoda ON dohoda_documents(dohoda_id);

-- 5. Extend bank_transactions with dohoda payment matching
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS matched_dohoda_mesic_id UUID REFERENCES dohoda_mesice(id);

-- 6. Feature flags: add 'dohodari' to plan_limits
UPDATE plan_limits
SET features = features || '{"dohodari": true}'::jsonb
WHERE (portal_type = 'accountant' AND plan_tier IN ('profi', 'business'));

UPDATE plan_limits
SET features = features || '{"dohodari": false}'::jsonb
WHERE (portal_type = 'accountant' AND plan_tier = 'zaklad');

-- Client portal: dohodari visible on plus+ (can submit timesheets)
UPDATE plan_limits
SET features = features || '{"dohodari": true}'::jsonb
WHERE (portal_type = 'client' AND plan_tier IN ('plus', 'premium'));

UPDATE plan_limits
SET features = features || '{"dohodari": false}'::jsonb
WHERE (portal_type = 'client' AND plan_tier = 'free');

-- 7. RLS policies (service_role bypasses, but define for safety)
ALTER TABLE dohody ENABLE ROW LEVEL SECURITY;
ALTER TABLE dohoda_mesice ENABLE ROW LEVEL SECURITY;
ALTER TABLE dohoda_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_dohody" ON dohody FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_dohoda_mesice" ON dohoda_mesice FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_dohoda_documents" ON dohoda_documents FOR ALL USING (true) WITH CHECK (true);
