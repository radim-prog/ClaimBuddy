-- SP/ZP manual inputs: 4 new nullable columns on tax_annual_config
-- Executed: 2026-04-03

ALTER TABLE tax_annual_config
  ADD COLUMN IF NOT EXISTS social_manual_base numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS social_manual_calculated numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_manual_base numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS health_manual_calculated numeric DEFAULT NULL;
