-- Handover protocols for company document/data transfers
CREATE TABLE IF NOT EXISTS handover_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  protocol_number TEXT NOT NULL,
  handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Parties
  from_name TEXT NOT NULL,
  from_role TEXT,
  to_name TEXT NOT NULL,
  to_role TEXT,
  -- Content
  items JSONB NOT NULL DEFAULT '[]',  -- [{name, quantity, note}]
  reason TEXT,  -- e.g. 'year_end', 'accountant_change', 'termination'
  notes TEXT,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'completed')),
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handover_protocols_company ON handover_protocols(company_id, created_at DESC);
