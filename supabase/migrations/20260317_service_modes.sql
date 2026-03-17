-- Service modes for insurance cases
ALTER TABLE insurance_cases
  ADD COLUMN IF NOT EXISTS service_mode TEXT NOT NULL DEFAULT 'self_service',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS power_of_attorney_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS success_fee_percent NUMERIC(5,2);

COMMENT ON COLUMN insurance_cases.service_mode IS 'self_service | consultation | full_representation';
COMMENT ON COLUMN insurance_cases.payment_status IS 'not_required | pending | paid | refunded';
COMMENT ON COLUMN insurance_cases.power_of_attorney_status IS 'not_required | pending | signed | revoked';
COMMENT ON COLUMN insurance_cases.success_fee_percent IS 'Success fee percentage for full_representation mode';
