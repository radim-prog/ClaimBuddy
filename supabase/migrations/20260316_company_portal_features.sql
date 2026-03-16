-- TASK-005 + TASK-006: Multi-firma klientsky portal + Portal sections visibility
-- Adds pending_review status for client-registered companies
-- Adds portal_sections JSONB for per-client section visibility

-- 1. Extend status constraint to include 'pending_review'
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE companies ADD CONSTRAINT companies_status_check
  CHECK (status IN ('active', 'inactive', 'onboarding', 'pending_review'));

-- 2. Portal sections — per-company toggle for client portal visibility
ALTER TABLE companies ADD COLUMN IF NOT EXISTS portal_sections JSONB DEFAULT '{
  "tax_overview": false,
  "assets": false,
  "employees": false,
  "tasks": false,
  "files": false,
  "insurances": false
}'::jsonb;
