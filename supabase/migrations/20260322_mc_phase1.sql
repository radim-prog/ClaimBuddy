-- MC Phase 1: Monthly Closing Enhancement — DB Migration
-- Adds: extended categories, match methods, new columns on bank_transactions,
--        periodic_patterns, transaction_match_groups, cash_registers, cash_transactions,
--        cash fields on monthly_closures

-- ============================================================
-- 1. ALTER bank_transactions — new columns
-- ============================================================

-- Specific symbol (specifický symbol)
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS specific_symbol TEXT;

-- Counterparty bank code (kód banky protistrany)
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS counterparty_bank_code TEXT;

-- User-facing note (poznámka klienta)
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS user_note TEXT;

-- Is recurring / periodic flag
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Linked periodic pattern
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS periodic_pattern_id UUID;

-- Match group for 1:N matching (partial payments)
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS match_group_id UUID;

-- ============================================================
-- 2. Extend category CHECK constraint (drop + re-add)
-- ============================================================

-- Drop old constraint
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_category_check;

-- Re-create with all 27 values
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_category_check
  CHECK (category IN (
    -- Original
    'uncategorized',
    'invoice_income',
    'other_taxable',
    'private_transfer',
    'owner_deposit',
    -- Expense categories
    'expense_material',
    'expense_services',
    'expense_rent',
    'expense_energy',
    'expense_transport',
    'expense_phone_internet',
    'expense_insurance',
    'expense_salary',
    'expense_tax_fee',
    'expense_other',
    -- Income categories
    'income_services',
    'income_goods',
    'income_rent',
    'income_interest',
    'income_other',
    -- Special / non-taxable
    'loan_repayment',
    'loan_received',
    'internal_transfer',
    'vat_payment',
    'tax_payment',
    'social_insurance_payment',
    'health_insurance_payment'
  ));

-- ============================================================
-- 3. Extend match_method CHECK constraint (drop + re-add)
-- ============================================================

ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_match_method_check;

ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_match_method_check
  CHECK (match_method IN (
    -- Original
    'variable_symbol',
    'amount_date',
    'fuzzy',
    'manual',
    'dohoda_amount_name',
    'dohoda_amount',
    -- New methods
    'partial_payment',
    'split_payment',
    'periodic_pattern',
    'ai_suggestion',
    'iban_match',
    'ico_match',
    'qr_code'
  ));

-- ============================================================
-- 4. CREATE periodic_patterns — recurring payment detection
-- ============================================================

CREATE TABLE IF NOT EXISTS periodic_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_name TEXT NOT NULL,                    -- e.g. "O2 Czech Republic — měsíční"
  counterparty_name TEXT,
  counterparty_account TEXT,
  variable_symbol TEXT,

  -- Pattern details
  amount_avg NUMERIC(12, 2),                     -- průměrná částka
  amount_min NUMERIC(12, 2),
  amount_max NUMERIC(12, 2),
  frequency TEXT NOT NULL DEFAULT 'monthly'       -- monthly, quarterly, yearly, irregular
    CHECK (frequency IN ('monthly', 'quarterly', 'yearly', 'irregular')),
  category TEXT,                                  -- default category for matched txns

  -- Expected next occurrence
  next_expected_date DATE,
  tolerance_days INTEGER DEFAULT 5,              -- +/- dny tolerance pro matching

  -- Tracking
  occurrence_count INTEGER DEFAULT 0,
  last_occurrence_date DATE,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_periodic_patterns_company ON periodic_patterns(company_id);
CREATE INDEX IF NOT EXISTS idx_periodic_patterns_active ON periodic_patterns(company_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- 5. CREATE transaction_match_groups — 1:N matching (partial payments)
-- ============================================================

CREATE TABLE IF NOT EXISTS transaction_match_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- What is being matched
  target_type TEXT NOT NULL CHECK (target_type IN ('document', 'invoice')),
  target_id UUID NOT NULL,                        -- document_id or invoice_id
  target_amount NUMERIC(12, 2) NOT NULL,          -- full amount of document/invoice

  -- Match status
  matched_amount NUMERIC(12, 2) DEFAULT 0,        -- sum of all partial matches
  is_fully_matched BOOLEAN DEFAULT FALSE,
  match_count INTEGER DEFAULT 0,                  -- number of transactions in this group

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_groups_company ON transaction_match_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_match_groups_target ON transaction_match_groups(target_type, target_id);

-- ============================================================
-- 6. CREATE cash_registers — evidence pokladen
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Hlavní pokladna',
  currency TEXT DEFAULT 'CZK',
  initial_balance NUMERIC(12, 2) DEFAULT 0,
  current_balance NUMERIC(12, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_company ON cash_registers(company_id);

-- ============================================================
-- 7. CREATE cash_transactions — PPD/VPD with auto-numbering
-- ============================================================

CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,

  -- Document type: PPD = Příjmový pokladní doklad, VPD = Výdajový pokladní doklad
  doc_type TEXT NOT NULL CHECK (doc_type IN ('PPD', 'VPD')),
  doc_number TEXT NOT NULL,                       -- auto-generated: PPD-2026-001, VPD-2026-001

  -- Transaction details
  transaction_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,                 -- always positive, sign determined by doc_type
  currency TEXT DEFAULT 'CZK',
  description TEXT,
  counterparty_name TEXT,

  -- Categorization & matching
  category TEXT,
  matched_document_id UUID REFERENCES documents(id),

  -- Period for closure
  period TEXT,                                    -- YYYY-MM

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_tx_company ON cash_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_register ON cash_transactions(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_cash_tx_period ON cash_transactions(period);

-- Auto-numbering function for cash transaction doc_number
CREATE OR REPLACE FUNCTION generate_cash_doc_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  next_seq INTEGER;
BEGIN
  year_str := EXTRACT(YEAR FROM NEW.transaction_date)::TEXT;

  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(doc_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_seq
  FROM cash_transactions
  WHERE company_id = NEW.company_id
    AND doc_type = NEW.doc_type
    AND doc_number LIKE NEW.doc_type || '-' || year_str || '-%';

  NEW.doc_number := NEW.doc_type || '-' || year_str || '-' || LPAD(next_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only auto-generate if doc_number is empty or placeholder
CREATE OR REPLACE TRIGGER trg_cash_doc_number
  BEFORE INSERT ON cash_transactions
  FOR EACH ROW
  WHEN (NEW.doc_number = '' OR NEW.doc_number = 'auto')
  EXECUTE FUNCTION generate_cash_doc_number();

-- ============================================================
-- 8. ALTER monthly_closures — cash fields
-- ============================================================

ALTER TABLE monthly_closures ADD COLUMN IF NOT EXISTS cash_income NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE monthly_closures ADD COLUMN IF NOT EXISTS cash_expense NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE monthly_closures ADD COLUMN IF NOT EXISTS cash_documents_status TEXT DEFAULT 'not_applicable';

-- ============================================================
-- 9. FK constraints for new columns on bank_transactions
-- ============================================================

-- periodic_pattern_id FK (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_transactions_periodic_pattern_id_fkey'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT bank_transactions_periodic_pattern_id_fkey
      FOREIGN KEY (periodic_pattern_id) REFERENCES periodic_patterns(id) ON DELETE SET NULL;
  END IF;
END $$;

-- match_group_id FK (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_transactions_match_group_id_fkey'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT bank_transactions_match_group_id_fkey
      FOREIGN KEY (match_group_id) REFERENCES transaction_match_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bank_tx_recurring ON bank_transactions(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_bank_tx_pattern ON bank_transactions(periodic_pattern_id) WHERE periodic_pattern_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_tx_match_group ON bank_transactions(match_group_id) WHERE match_group_id IS NOT NULL;

-- ============================================================
-- 10. RLS policies for new tables
-- ============================================================

ALTER TABLE periodic_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_match_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- Service role bypass (same pattern as other tables)
CREATE POLICY "Service role full access" ON periodic_patterns FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access" ON transaction_match_groups FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access" ON cash_registers FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Service role full access" ON cash_transactions FOR ALL USING (TRUE) WITH CHECK (TRUE);
