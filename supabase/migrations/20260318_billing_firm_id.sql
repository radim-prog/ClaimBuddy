-- Add firm_id to billing tables for multi-tenant isolation
-- Defense-in-depth: provider_id already scopes, firm_id enables RLS + simpler queries

ALTER TABLE billing_configs
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

ALTER TABLE billing_invoices
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

ALTER TABLE billing_payouts
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES accounting_firms(id);

-- Backfill firm_id from provider → accounting_firms link
UPDATE billing_configs bc
  SET firm_id = af.id
  FROM marketplace_providers mp
  JOIN accounting_firms af ON af.marketplace_provider_id = mp.id
  WHERE bc.provider_id = mp.id
    AND bc.firm_id IS NULL;

UPDATE billing_invoices bi
  SET firm_id = bc.firm_id
  FROM billing_configs bc
  WHERE bi.config_id = bc.id
    AND bi.firm_id IS NULL
    AND bc.firm_id IS NOT NULL;

UPDATE billing_payouts bp
  SET firm_id = af.id
  FROM marketplace_providers mp
  JOIN accounting_firms af ON af.marketplace_provider_id = mp.id
  WHERE bp.provider_id = mp.id
    AND bp.firm_id IS NULL;

-- Indexes for firm_id scoping
CREATE INDEX IF NOT EXISTS idx_billing_configs_firm ON billing_configs(firm_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_firm ON billing_invoices(firm_id);
CREATE INDEX IF NOT EXISTS idx_billing_payouts_firm ON billing_payouts(firm_id);
