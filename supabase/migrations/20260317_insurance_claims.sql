-- Migration: Insurance Claims Module
-- Date: 2026-03-17

-- 1. Add modules column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '["accounting"]';

-- 2. Table: insurance_companies (číselník pojišťoven)
CREATE TABLE IF NOT EXISTS insurance_companies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  code            TEXT        UNIQUE,
  ico             TEXT,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  claims_email    TEXT,
  claims_phone    TEXT,
  web_url         TEXT,
  logo_path       TEXT,
  active          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seed: 10 CZ pojišťoven
INSERT INTO insurance_companies (name, code, ico) VALUES
  ('Česká pojišťovna',                 'CP',      '45272956'),
  ('Kooperativa pojišťovna',           'KOOP',    '47116617'),
  ('Allianz pojišťovna',               'ALLIANZ', '47115971'),
  ('Generali Česká pojišťovna',        'GCP',     '45272956'),
  ('ČSOB Pojišťovna',                  'CSOB',    '45534306'),
  ('UNIQA pojišťovna',                 'UNIQA',   '49240480'),
  ('Pojišťovna České spořitelny',      'PCS',     '47452820'),
  ('Slavia pojišťovna',                'SLAVIA',  '60197501'),
  ('Direct pojišťovna',                'DIRECT',  '25073958'),
  ('Hasičská vzájemná pojišťovna',     'HVP',     '46973079')
ON CONFLICT (code) DO NOTHING;

-- 4. Table: insurance_cases (spisy pojistných událostí)
CREATE TABLE IF NOT EXISTS insurance_cases (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID           REFERENCES companies(id) ON DELETE SET NULL,
  assigned_to           UUID           REFERENCES users(id) ON DELETE SET NULL,
  case_number           TEXT           NOT NULL,
  policy_number         TEXT,
  claim_number          TEXT,
  insurance_company_id  UUID           REFERENCES insurance_companies(id),
  insurance_type        TEXT           NOT NULL DEFAULT 'other'
                          CHECK (insurance_type IN ('auto','property','life','liability','travel','industrial','other')),
  event_date            DATE,
  event_description     TEXT,
  event_location        TEXT,
  claimed_amount        NUMERIC(12,2),
  approved_amount       NUMERIC(12,2),
  paid_amount           NUMERIC(12,2)  DEFAULT 0,
  status                TEXT           NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new','gathering_docs','submitted','under_review','additional_info','partially_approved','approved','rejected','appealed','closed','cancelled')),
  priority              TEXT           DEFAULT 'normal'
                          CHECK (priority IN ('low','normal','high','urgent')),
  deadline              DATE,
  note                  TEXT,
  tags                  JSONB          DEFAULT '[]',
  project_id            UUID           REFERENCES prepaid_projects(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 5. Table: insurance_case_documents
CREATE TABLE IF NOT EXISTS insurance_case_documents (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID        NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  file_path       TEXT        NOT NULL,
  file_size       INT,
  mime_type       TEXT,
  document_type   TEXT        NOT NULL DEFAULT 'other'
                    CHECK (document_type IN ('claim_report','photo','expert_report','correspondence','decision','invoice','power_of_attorney','police_report','medical_report','other')),
  uploaded_by     UUID        REFERENCES users(id),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table: insurance_case_events (timeline/audit)
CREATE TABLE IF NOT EXISTS insurance_case_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      UUID        NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  event_type   TEXT        NOT NULL,
  actor        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Table: insurance_payments
CREATE TABLE IF NOT EXISTS insurance_payments (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID           NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2)  NOT NULL,
  payment_type  TEXT           NOT NULL DEFAULT 'partial'
                  CHECK (payment_type IN ('partial','full','advance','refund')),
  payment_date  DATE           NOT NULL,
  reference     TEXT,
  note          TEXT,
  created_by    UUID           REFERENCES users(id),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_cases_company
  ON insurance_cases(company_id);

CREATE INDEX IF NOT EXISTS idx_insurance_cases_assigned
  ON insurance_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_insurance_cases_status
  ON insurance_cases(status)
  WHERE status NOT IN ('closed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_insurance_cases_insurance
  ON insurance_cases(insurance_company_id);

CREATE INDEX IF NOT EXISTS idx_insurance_case_docs
  ON insurance_case_documents(case_id);

CREATE INDEX IF NOT EXISTS idx_insurance_case_events
  ON insurance_case_events(case_id);

CREATE INDEX IF NOT EXISTS idx_insurance_payments_case
  ON insurance_payments(case_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_cases_number
  ON insurance_cases(case_number);
