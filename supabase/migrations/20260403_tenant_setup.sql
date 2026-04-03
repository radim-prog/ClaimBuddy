-- Tenant system setup: is_system_admin + Zajíček Consulting firm assignment
-- Executed: 2026-04-03

-- 1. Add is_system_admin boolean column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_system_admin BOOLEAN DEFAULT false;

-- 2. Set Radim as system admin
UPDATE users SET is_system_admin = true WHERE login_name = 'radim';

-- 3. Insert Zajíček Consulting (the accounting firm)
INSERT INTO accounting_firms (name, ico, dic, email, address, plan_tier, status, onboarded_at)
VALUES (
  'Zajíček Consulting s.r.o.',
  '07343957',
  'CZ07343957',
  'radim.zajicek@icloud.com',
  '{"street": "Nové Sady 988/2", "city": "Brno", "zip": "602 00"}'::jsonb,
  'professional',
  'active',
  now()
)
ON CONFLICT DO NOTHING;

-- 4. Assign all staff users to the firm
UPDATE users
SET firm_id = (SELECT id FROM accounting_firms WHERE ico = '07343957')
WHERE firm_id IS NULL
  AND role IN ('admin', 'accountant', 'assistant');

-- 5. Assign all active companies to the firm
UPDATE companies
SET firm_id = (SELECT id FROM accounting_firms WHERE ico = '07343957')
WHERE firm_id IS NULL
  AND deleted_at IS NULL;
