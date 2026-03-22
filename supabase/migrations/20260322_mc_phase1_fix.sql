-- MC Phase 1 Fix: RLS idempotence + UNIQUE doc_number

-- Fix 1: RLS policies — drop + recreate for idempotence
DROP POLICY IF EXISTS "Service role full access" ON periodic_patterns;
CREATE POLICY "Service role full access" ON periodic_patterns FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON transaction_match_groups;
CREATE POLICY "Service role full access" ON transaction_match_groups FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON cash_registers;
CREATE POLICY "Service role full access" ON cash_registers FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role full access" ON cash_transactions;
CREATE POLICY "Service role full access" ON cash_transactions FOR ALL USING (true);

-- Fix 2: UNIQUE constraint on cash_transactions doc_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cash_tx_doc_number_unique'
  ) THEN
    ALTER TABLE cash_transactions
      ADD CONSTRAINT cash_tx_doc_number_unique UNIQUE(company_id, doc_type, doc_number);
  END IF;
END $$;
