-- Fix match_method CHECK constraint to include dohoda match methods
ALTER TABLE bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_match_method_check;
ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_match_method_check
  CHECK (match_method IN ('variable_symbol', 'amount_date', 'fuzzy', 'manual', 'dohoda_amount_name', 'dohoda_amount'));
