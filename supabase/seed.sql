-- ============================================
-- SEED DATA - Mock data pro testování
-- ============================================
-- Spusť tento script v Supabase SQL Editor
-- Vytvoří testovací uživatele, firmy a uzávěrky
-- ============================================

-- 1. VYTVOŘIT UŽIVATELE (MUSÍŠ UDĚLAT RUČNĚ!)
-- V Supabase Dashboard → Authentication → Users → Add user
-- User 1 (Client):
--   Email: karel@example.com
--   Password: Test123456!
--   Confirm: Yes
--   → Zkopíruj UUID (např. '550e8400-e29b-41d4-a716-446655440001')
--
-- User 2 (Accountant):
--   Email: jana@ucetni.cz
--   Password: Test123456!
--   Confirm: Yes
--   → Zkopíruj UUID (např. '550e8400-e29b-41d4-a716-446655440002')

-- ============================================
-- 2. EXTENDED USER DATA (REPLACE UUIDs!)
-- ============================================

-- DŮLEŽITÉ: Nahraď tyto UUID skutečnými ID z Auth!
DO $$
DECLARE
  client_uuid UUID := '550e8400-e29b-41d4-a716-446655440001'; -- REPLACE!
  accountant_uuid UUID := '550e8400-e29b-41d4-a716-446655440002'; -- REPLACE!
BEGIN

-- Insert extended user data
INSERT INTO public.users (id, email, name, role, phone_number) VALUES
  (client_uuid, 'karel@example.com', 'Karel Novák', 'client', '+420777123456'),
  (accountant_uuid, 'jana@ucetni.cz', 'Jana Svobodová', 'accountant', '+420777654321')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone_number = EXCLUDED.phone_number;

-- ============================================
-- 3. COMPANIES (5 testovacích firem)
-- ============================================

INSERT INTO public.companies (id, owner_id, assigned_accountant_id, name, ico, dic, vat_payer, vat_period, legal_form, address, email, phone) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    client_uuid,
    accountant_uuid,
    'ABC s.r.o.',
    '12345678',
    'CZ12345678',
    true,
    'monthly',
    'sro',
    '{"street": "Hlavní 123", "city": "Praha", "zip": "110 00"}'::jsonb,
    'abc@example.com',
    '+420777111222'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    client_uuid,
    accountant_uuid,
    'XYZ OSVČ',
    '87654321',
    'CZ87654321',
    false,
    NULL,
    'fyzicka_osoba',
    '{"street": "Vedlejší 456", "city": "Brno", "zip": "602 00"}'::jsonb,
    'xyz@example.com',
    '+420777222333'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    client_uuid,
    accountant_uuid,
    'DEF s.r.o.',
    '11223344',
    'CZ11223344',
    true,
    'quarterly',
    'sro',
    '{"street": "Nová 789", "city": "Ostrava", "zip": "700 00"}'::jsonb,
    'def@example.com',
    '+420777333444'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    client_uuid,
    accountant_uuid,
    'GHI Trading',
    '55667788',
    'CZ55667788',
    true,
    'monthly',
    'sro',
    '{"street": "Obchodní 1", "city": "Plzeň", "zip": "301 00"}'::jsonb,
    'ghi@example.com',
    '+420777444555'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    client_uuid,
    accountant_uuid,
    'JKL Consulting',
    '99887766',
    'CZ99887766',
    false,
    NULL,
    'sro',
    '{"street": "Poradenská 10", "city": "Liberec", "zip": "460 00"}'::jsonb,
    'jkl@example.com',
    '+420777555666'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  ico = EXCLUDED.ico;

-- ============================================
-- 4. MONTHLY CLOSURES (12 měsíců × 5 firem = 60 záznamů)
-- ============================================

-- Generate closures for all companies for 2025
WITH company_ids AS (
  SELECT id FROM public.companies WHERE owner_id = client_uuid
),
months AS (
  SELECT generate_series(1, 12) AS month_num
)
INSERT INTO public.monthly_closures (
  company_id,
  period,
  status,
  bank_statement_status,
  expense_documents_status,
  income_invoices_status
)
SELECT
  c.id,
  '2025-' || LPAD(m.month_num::text, 2, '0') AS period,
  'open' AS status,
  -- Strategicky nastavit statusy pro zajímavou Master Matici
  CASE
    WHEN m.month_num <= 3 THEN 'approved'::text  -- Led-Bře: schváleno
    WHEN m.month_num <= 6 THEN 'uploaded'::text  -- Dub-Čer: nahráno
    ELSE 'missing'::text  -- Čec-Pro: chybí
  END AS bank_statement_status,
  CASE
    WHEN m.month_num <= 3 THEN 'approved'::text
    WHEN m.month_num <= 6 THEN 'uploaded'::text
    ELSE 'missing'::text
  END AS expense_documents_status,
  CASE
    WHEN m.month_num <= 3 THEN 'approved'::text
    WHEN m.month_num <= 6 THEN 'uploaded'::text
    ELSE 'missing'::text
  END AS income_invoices_status
FROM company_ids c
CROSS JOIN months m
ON CONFLICT (company_id, period) DO NOTHING;

END $$;

-- ============================================
-- 5. VERIFY DATA
-- ============================================

-- Check users
SELECT 'Users:' AS table_name, COUNT(*) AS count FROM public.users
UNION ALL
SELECT 'Companies:', COUNT(*) FROM public.companies
UNION ALL
SELECT 'Monthly Closures:', COUNT(*) FROM public.monthly_closures;

-- Show sample data
SELECT
  c.name AS company,
  COUNT(mc.id) AS closures,
  SUM(CASE WHEN mc.bank_statement_status = 'missing' THEN 1 ELSE 0 END) AS missing,
  SUM(CASE WHEN mc.bank_statement_status = 'uploaded' THEN 1 ELSE 0 END) AS uploaded,
  SUM(CASE WHEN mc.bank_statement_status = 'approved' THEN 1 ELSE 0 END) AS approved
FROM public.companies c
LEFT JOIN public.monthly_closures mc ON mc.company_id = c.id
GROUP BY c.name
ORDER BY c.name;

-- ============================================
-- HOTOVO! 🎉
-- ============================================
-- Nyní můžeš:
-- 1. Login jako karel@example.com (client) → Vidíš 5 firem
-- 2. Login jako jana@ucetni.cz (accountant) → Vidíš Master Matrix
