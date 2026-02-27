-- Bank transactions table for client bank statement parsing and document matching
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  bank_statement_document_id UUID REFERENCES documents(id),

  transaction_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,  -- positive = income, negative = expense
  currency TEXT DEFAULT 'CZK',
  variable_symbol TEXT,
  constant_symbol TEXT,
  counterparty_account TEXT,
  counterparty_name TEXT,
  description TEXT,

  -- Income categorization
  category TEXT DEFAULT 'uncategorized'
    CHECK (category IN ('invoice_income','other_taxable','private_transfer','owner_deposit','uncategorized')),

  -- Document matching
  matched_document_id UUID REFERENCES documents(id),
  matched_invoice_id UUID REFERENCES invoices(id),
  match_confidence NUMERIC(3, 2),
  match_method TEXT CHECK (match_method IN ('variable_symbol','amount_date','fuzzy','manual')),

  -- Pre-calculated tax impact
  tax_impact NUMERIC(12, 2) DEFAULT 0,
  vat_impact NUMERIC(12, 2) DEFAULT 0,

  period TEXT,  -- YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_tx_company ON bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_period ON bank_transactions(period);
CREATE INDEX IF NOT EXISTS idx_bank_tx_vs ON bank_transactions(variable_symbol) WHERE variable_symbol IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_tx_matched ON bank_transactions(matched_document_id) WHERE matched_document_id IS NOT NULL;

-- Client invoice favorites for quick reuse
CREATE TABLE IF NOT EXISTS client_invoice_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  type TEXT NOT NULL CHECK (type IN ('item', 'partner')),
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_fav_company ON client_invoice_favorites(company_id);

-- Telegram chat ID for client notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Notification preferences for clients
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "telegram": false, "types": {"missing_document_tax_impact": true, "invoice_due_reminder": true, "monthly_summary": true}}'::jsonb;
