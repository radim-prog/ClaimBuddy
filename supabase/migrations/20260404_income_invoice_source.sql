-- Add income_invoice_source column to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS income_invoice_source TEXT DEFAULT 'unknown';

COMMENT ON COLUMN companies.income_invoice_source IS
  'internal = fakturuje v našem systému, external = jiný systém, parent_company = mateřská firma, none = nefakturuje';
