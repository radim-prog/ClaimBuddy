-- Structure: description + nickname columns + ownership data import
-- Executed: 2026-04-03

-- 1. New columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. Company types for Radim's structure
UPDATE companies SET company_type = 'person' WHERE id = '48bf07db-1040-48ea-9856-a92e145c19c1'; -- Radim FO
UPDATE companies SET company_type = 'holding' WHERE id = '571f6faf-9024-470f-ad25-ecd20d879bef'; -- Zajíček Holding
UPDATE companies SET company_type = 'daughter' WHERE id IN (
  'ca55f2a4-0425-4402-bb97-223bb6c06e24', '81405a26-d9f5-470f-87ae-0ade760ffb0d',
  '2621c7bd-0529-4892-bc7e-1870254948ba', '2edcecb4-005f-4be7-9e9e-8d9deefc551f',
  'fa8833ff-6e89-4704-928d-857411f52281', '04500418-238e-4d03-9bc1-2dc53181eb64',
  '39fc204a-b906-485a-86c9-46daf232f490', 'f4f1011b-ab3b-49d5-a681-c58f165de023'
);
UPDATE companies SET company_type = 'granddaughter' WHERE id IN (
  'ad6e9ecb-eb05-470d-9263-90754177c958', 'e33e6684-bd42-426e-b4dc-d2664328d5a9',
  '3663a4a0-d570-4e58-b29e-c35c0d2e1d89'
);

-- 3. Ownership relationships (17 total)
-- See main migration log for full INSERT statements
