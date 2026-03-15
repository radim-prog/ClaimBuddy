-- Knowledge Base: repository of Czech accounting laws, standards, and procedures
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('laws', 'standards', 'decrees', 'chart_of_accounts', 'vat', 'income_tax', 'payroll', 'procedures')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category, sort_order);
