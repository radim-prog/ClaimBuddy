-- ============================================================
-- Seed script for WikiPoradce.cz client demo data
-- Company: 81405a26-d9f5-470f-87ae-0ade760ffb0d
-- Client user: d84a9316-03e5-4ce3-bab8-c0f340042f1e
-- Re-runnable: uses ON CONFLICT / WHERE NOT EXISTS patterns
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: Update company owner
-- ============================================================
UPDATE companies
SET owner_id = 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
WHERE id = '81405a26-d9f5-470f-87ae-0ade760ffb0d';

-- ============================================================
-- Step 2: Invoice Partners (4)
-- ============================================================
-- Using deterministic UUIDs (uuid v5 style via md5) for idempotency
INSERT INTO invoice_partners (id, company_id, name, ico, dic, address, city, postal_code, usage_count)
VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Acme Corp s.r.o.',
    '12345678',
    'CZ12345678',
    'Vinohradská 42',
    'Praha',
    '12000',
    3
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Digital Solutions a.s.',
    '87654321',
    'CZ87654321',
    'Technická 5',
    'Brno',
    '60200',
    2
  ),
  (
    'a1b2c3d4-0003-4000-8000-000000000003',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Marketing Pro s.r.o.',
    '11223344',
    'CZ11223344',
    'Na Příkopě 15',
    'Praha',
    '11000',
    1
  ),
  (
    'a1b2c3d4-0004-4000-8000-000000000004',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'TechStart s.r.o.',
    '55667788',
    'CZ55667788',
    'Nádražní 12',
    'Ostrava',
    '70200',
    1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 3: Invoices (5)
-- ============================================================
-- Invoice 1: FV/2026/0001, paid, Acme Corp
INSERT INTO invoices (
  id, company_id, type, document_type, invoice_number, variable_symbol,
  issue_date, due_date, tax_date, period,
  partner, partner_id, items,
  total_without_vat, total_vat, total_with_vat,
  payment_status, paid_at, paid_amount,
  payment_method, created_by
) VALUES (
  'b1b2c3d4-0001-4000-8000-000000000001',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'income', 'invoice', 'FV/2026/0001', '20260001',
  '2026-01-15', '2026-02-14', '2026-01-15', '2026-01',
  '{"name": "Acme Corp s.r.o.", "ico": "12345678", "dic": "CZ12345678", "address": "Vinohradská 42", "city": "Praha", "postal_code": "12000"}'::jsonb,
  'a1b2c3d4-0001-4000-8000-000000000001',
  '[{"description": "Vedení účetnictví leden 2026", "quantity": 1, "unit_price": 20000, "vat_rate": 21, "total": 24200}]'::jsonb,
  20000, 4200, 24200,
  'paid', '2026-02-10T10:00:00Z', 24200,
  'bank_transfer', 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
) ON CONFLICT (id) DO NOTHING;

-- Invoice 2: FV/2026/0002, sent, Digital Solutions
INSERT INTO invoices (
  id, company_id, type, document_type, invoice_number, variable_symbol,
  issue_date, due_date, tax_date, period,
  partner, partner_id, items,
  total_without_vat, total_vat, total_with_vat,
  payment_status, sent_at,
  payment_method, created_by
) VALUES (
  'b1b2c3d4-0002-4000-8000-000000000002',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'income', 'invoice', 'FV/2026/0002', '20260002',
  '2026-02-10', '2026-03-12', '2026-02-10', '2026-02',
  '{"name": "Digital Solutions a.s.", "ico": "87654321", "dic": "CZ87654321", "address": "Technická 5", "city": "Brno", "postal_code": "60200"}'::jsonb,
  'a1b2c3d4-0002-4000-8000-000000000002',
  '[{"description": "IT poradenství únor 2026", "quantity": 2, "unit_price": 20000, "vat_rate": 21, "total": 48400}]'::jsonb,
  40000, 8400, 48400,
  'unpaid', '2026-02-11T09:00:00Z',
  'bank_transfer', 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
) ON CONFLICT (id) DO NOTHING;

-- Invoice 3: FV/2026/0003, unpaid (overdue!), Marketing Pro
INSERT INTO invoices (
  id, company_id, type, document_type, invoice_number, variable_symbol,
  issue_date, due_date, tax_date, period,
  partner, partner_id, items,
  total_without_vat, total_vat, total_with_vat,
  payment_status,
  payment_method, created_by
) VALUES (
  'b1b2c3d4-0003-4000-8000-000000000003',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'income', 'invoice', 'FV/2026/0003', '20260003',
  '2026-01-20', '2026-02-19', '2026-01-20', '2026-01',
  '{"name": "Marketing Pro s.r.o.", "ico": "11223344", "dic": "CZ11223344", "address": "Na Příkopě 15", "city": "Praha", "postal_code": "11000"}'::jsonb,
  'a1b2c3d4-0003-4000-8000-000000000003',
  '[{"description": "Marketingové služby Q1 2026", "quantity": 1, "unit_price": 10000, "vat_rate": 21, "total": 12100}]'::jsonb,
  10000, 2100, 12100,
  'overdue',
  'bank_transfer', 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
) ON CONFLICT (id) DO NOTHING;

-- Invoice 4: ZF/2026/0001, proforma, unpaid, TechStart
INSERT INTO invoices (
  id, company_id, type, document_type, invoice_number, variable_symbol,
  issue_date, due_date, tax_date, period,
  partner, partner_id, items,
  total_without_vat, total_vat, total_with_vat,
  payment_status,
  payment_method, created_by
) VALUES (
  'b1b2c3d4-0004-4000-8000-000000000004',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'income', 'proforma', 'ZF/2026/0001', '20260101',
  '2026-03-01', '2026-03-31', '2026-03-01', '2026-03',
  '{"name": "TechStart s.r.o.", "ico": "55667788", "dic": "CZ55667788", "address": "Nádražní 12", "city": "Ostrava", "postal_code": "70200"}'::jsonb,
  'a1b2c3d4-0004-4000-8000-000000000004',
  '[{"description": "Implementace účetního systému", "quantity": 1, "unit_price": 30000, "vat_rate": 21, "total": 36300}]'::jsonb,
  30000, 6300, 36300,
  'unpaid',
  'bank_transfer', 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
) ON CONFLICT (id) DO NOTHING;

-- Invoice 5: FV/2026/0004, paid, Novák Consulting (no partner record)
INSERT INTO invoices (
  id, company_id, type, document_type, invoice_number, variable_symbol,
  issue_date, due_date, tax_date, period,
  partner, items,
  total_without_vat, total_vat, total_with_vat,
  payment_status, paid_at, paid_amount,
  payment_method, created_by
) VALUES (
  'b1b2c3d4-0005-4000-8000-000000000005',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'income', 'invoice', 'FV/2026/0004', '20260004',
  '2026-03-05', '2026-04-04', '2026-03-05', '2026-03',
  '{"name": "Novák Consulting", "ico": "99887766", "address": "Dlouhá 8", "city": "Praha", "postal_code": "11000"}'::jsonb,
  '[{"description": "Jednorázová konzultace", "quantity": 1, "unit_price": 5000, "vat_rate": 21, "total": 6050}]'::jsonb,
  5000, 1050, 6050,
  'paid', '2026-03-08T14:30:00Z', 6050,
  'bank_transfer', 'd84a9316-03e5-4ce3-bab8-c0f340042f1e'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 4: Travel Vehicles (2)
-- ============================================================
INSERT INTO travel_vehicles (
  id, company_id, name, license_plate, brand, model, year,
  fuel_type, fuel_consumption, current_odometer, is_company_car, vehicle_category
) VALUES
  (
    'c1b2c3d4-0001-4000-8000-000000000001',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Škoda Octavia', '4AB 1234', 'Škoda', 'Octavia', 2022,
    'diesel', 6.5, 125000, true, 'car'
  ),
  (
    'c1b2c3d4-0002-4000-8000-000000000002',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Hyundai Tucson', '3AC 5678', 'Hyundai', 'Tucson', 2023,
    'petrol', 8.2, 45000, true, 'car'
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 5: Travel Drivers (1)
-- ============================================================
INSERT INTO travel_drivers (
  id, company_id, name, is_default, is_active
) VALUES (
  'd1b2c3d4-0001-4000-8000-000000000001',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'Radim Zajíček',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 6: Travel Places (5)
-- ============================================================
INSERT INTO travel_places (id, company_id, name, address, is_favorite, visit_count) VALUES
  (
    'e1b2c3d4-0001-4000-8000-000000000001',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Kancelář Praha', 'Vodičkova 30, Praha', true, 25
  ),
  (
    'e1b2c3d4-0002-4000-8000-000000000002',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Klient Brno', 'Masarykova 10, Brno', true, 8
  ),
  (
    'e1b2c3d4-0003-4000-8000-000000000003',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'FÚ Praha 2', 'Vinohradská 48, Praha 2', false, 3
  ),
  (
    'e1b2c3d4-0004-4000-8000-000000000004',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Sklad Hostivař', 'Průmyslová 5, Praha 10', false, 2
  ),
  (
    'e1b2c3d4-0005-4000-8000-000000000005',
    '81405a26-d9f5-470f-87ae-0ade760ffb0d',
    'Letiště Václava Havla', 'K Letišti 1, Praha 6', false, 1
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 7: Travel Trips (6 in March 2026)
-- ============================================================
-- Trip 1: Business - Kancelář → Klient Brno (150 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0001-4000-8000-000000000001',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0001-4000-8000-000000000001',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-03', '07:30', '09:45',
  'Kancelář Praha', 'Klient Brno',
  'D1 Praha → Brno', 'Jednání s klientem Digital Solutions', 'business',
  150, 125000, 125150,
  false, 5.90, 5.90, 36.50
) ON CONFLICT (id) DO NOTHING;

-- Trip 2: Business - Klient Brno → Kancelář (return, 150 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0002-4000-8000-000000000002',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0001-4000-8000-000000000001',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-03', '15:00', '17:15',
  'Klient Brno', 'Kancelář Praha',
  'D1 Brno → Praha', 'Návrat z jednání', 'business',
  150, 125150, 125300,
  false, 5.90, 5.90, 36.50
) ON CONFLICT (id) DO NOTHING;

-- Trip 3: Business - Kancelář → FÚ Praha 2 (12 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0003-4000-8000-000000000003',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0002-4000-8000-000000000002',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-07', '09:00', '09:30',
  'Kancelář Praha', 'FÚ Praha 2',
  'Centrum → Vinohrady', 'Podání DPH přiznání', 'business',
  12, 45000, 45012,
  true, 5.90, 5.90, 38.20
) ON CONFLICT (id) DO NOTHING;

-- Trip 4: Private - Kancelář → Letiště (25 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0004-4000-8000-000000000004',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0002-4000-8000-000000000002',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-14', '16:00', '16:45',
  'Kancelář Praha', 'Letiště Václava Havla',
  'Centrum → Ruzyně', 'Osobní cesta', 'private',
  25, 45012, 45037,
  false, 5.90, 5.90, 38.20
) ON CONFLICT (id) DO NOTHING;

-- Trip 5: Business - Kancelář → Sklad Hostivař (18 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0005-4000-8000-000000000005',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0001-4000-8000-000000000001',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-20', '10:00', '10:40',
  'Kancelář Praha', 'Sklad Hostivař',
  'Centrum → Hostivař', 'Vyzvednutí archivních dokladů', 'business',
  18, 125300, 125318,
  true, 5.90, 5.90, 36.50
) ON CONFLICT (id) DO NOTHING;

-- Trip 6: Commute - Domov → Kancelář (10 km)
INSERT INTO travel_trips (
  id, company_id, vehicle_id, driver_id,
  trip_date, departure_time, arrival_time,
  origin, destination, route_description, purpose, trip_type,
  distance_km, odometer_start, odometer_end,
  is_round_trip, rate_per_km, basic_rate_per_km, fuel_price_per_unit
) VALUES (
  'f1b2c3d4-0006-4000-8000-000000000006',
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  'c1b2c3d4-0002-4000-8000-000000000002',
  'd1b2c3d4-0001-4000-8000-000000000001',
  '2026-03-25', '07:45', '08:15',
  'Domov', 'Kancelář Praha',
  'Žižkov → Vodičkova', 'Dojíždění do práce', 'commute',
  10, 45037, 45047,
  false, 5.90, 5.90, 38.20
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Step 8: Monthly Closures (Jan/Feb/Mar 2026)
-- ============================================================
-- January 2026: all approved
INSERT INTO monthly_closures (
  company_id, period, status,
  bank_statement_status, expense_invoices_status, income_invoices_status,
  company_name
) VALUES (
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  '2026-01', 'closed',
  'approved', 'approved', 'approved',
  'WikiPoradce.cz'
) ON CONFLICT ON CONSTRAINT monthly_closures_company_id_period_key DO UPDATE SET
  bank_statement_status = EXCLUDED.bank_statement_status,
  expense_invoices_status = EXCLUDED.expense_invoices_status,
  income_invoices_status = EXCLUDED.income_invoices_status,
  status = EXCLUDED.status;

-- February 2026: partially uploaded
INSERT INTO monthly_closures (
  company_id, period, status,
  bank_statement_status, expense_invoices_status, income_invoices_status,
  company_name
) VALUES (
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  '2026-02', 'open',
  'uploaded', 'uploaded', 'missing',
  'WikiPoradce.cz'
) ON CONFLICT ON CONSTRAINT monthly_closures_company_id_period_key DO UPDATE SET
  bank_statement_status = EXCLUDED.bank_statement_status,
  expense_invoices_status = EXCLUDED.expense_invoices_status,
  income_invoices_status = EXCLUDED.income_invoices_status,
  status = EXCLUDED.status;

-- March 2026: all missing
INSERT INTO monthly_closures (
  company_id, period, status,
  bank_statement_status, expense_invoices_status, income_invoices_status,
  company_name
) VALUES (
  '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  '2026-03', 'open',
  'missing', 'missing', 'missing',
  'WikiPoradce.cz'
) ON CONFLICT ON CONSTRAINT monthly_closures_company_id_period_key DO UPDATE SET
  bank_statement_status = EXCLUDED.bank_statement_status,
  expense_invoices_status = EXCLUDED.expense_invoices_status,
  income_invoices_status = EXCLUDED.income_invoices_status,
  status = EXCLUDED.status;

COMMIT;
