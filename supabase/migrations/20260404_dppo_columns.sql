-- DPPO: Adjustments, deductions, credits, advances
ALTER TABLE tax_annual_config
  ADD COLUMN IF NOT EXISTS dppo_add_back numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_deductible numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_loss_deduction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_donations numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_rd_deduction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_ztpp_employees integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dppo_advances_paid numeric DEFAULT 0;
