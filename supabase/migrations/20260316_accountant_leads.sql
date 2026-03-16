-- Lead capture table for "Chci účetní" feature
CREATE TABLE IF NOT EXISTS accountant_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'rejected')),
  preferred_location TEXT,
  business_type TEXT,
  budget_range TEXT,
  note TEXT,
  source TEXT DEFAULT 'upsell_banner',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accountant_leads_status ON accountant_leads(status);
CREATE INDEX idx_accountant_leads_user ON accountant_leads(user_id);
