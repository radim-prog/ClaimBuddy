-- Add billing frequency support (monthly/quarterly)
ALTER TABLE billing_configs
  ADD COLUMN IF NOT EXISTS billing_frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_frequency IN ('monthly', 'quarterly'));
