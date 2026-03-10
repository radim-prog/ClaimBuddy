-- Raynet CRM integration: mapping + sync tables
-- Run this in Supabase SQL editor

-- 1. Add raynet_company_id to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS raynet_company_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_companies_raynet ON companies(raynet_company_id)
  WHERE raynet_company_id IS NOT NULL;

-- 2. Sync state per company
CREATE TABLE IF NOT EXISTS raynet_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'never_synced',
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Payment links: our payment ↔ Raynet BC
CREATE TABLE IF NOT EXISTS raynet_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  raynet_bc_id INTEGER NOT NULL,
  raynet_bc_name TEXT,
  raynet_amount NUMERIC(12,2),
  is_extra_service BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, raynet_bc_id)
);

CREATE INDEX IF NOT EXISTS idx_raynet_payment_links_period ON raynet_payment_links(company_id, period);
