-- Tax period data: monthly revenue, expenses, VAT tracking per company
CREATE TABLE IF NOT EXISTS tax_period_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,                     -- 'YYYY-MM'
  revenue NUMERIC(12, 2) DEFAULT 0,        -- Příjmy
  expenses NUMERIC(12, 2) DEFAULT 0,       -- Výdaje
  vat_output NUMERIC(12, 2) DEFAULT 0,     -- DPH na výstupu
  vat_input NUMERIC(12, 2) DEFAULT 0,      -- DPH na vstupu
  vat_result NUMERIC(12, 2),               -- NULL = auto (output-input), non-null = override
  tax_base_override NUMERIC(12, 2),        -- NULL = auto (revenue-expenses), non-null = override
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, period)
);

CREATE INDEX idx_tax_period_data_period ON tax_period_data(period);
CREATE INDEX idx_tax_period_data_company ON tax_period_data(company_id);
