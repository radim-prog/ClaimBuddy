-- =============================================================================
-- ClaimBuddy standalone database bootstrap
-- =============================================================================
-- Purpose:
--   Minimal standalone PostgreSQL/Supabase schema for the extracted claims app.
--   This keeps ClaimBuddy on its own database while preserving enough table
--   shape to run the existing application with a smaller blast radius.
--
-- Notes:
--   1. This is intentionally not the full accounting schema.
--   2. It preserves generic table names (`users`, `companies`, `client_users`)
--      for compatibility during the split. Client access is primarily derived
--      from `companies.owner_id`; `client_users` is a compatibility table.
--   3. Cross-system linkage should use `accounting_*` fields, not direct joins
--      back into the accounting database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('client','junior','senior','accountant','admin','assistant','manager')),
  login_name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  compensation_type TEXT DEFAULT 'monthly',
  compensation_amount NUMERIC(12,2) DEFAULT 0,
  plan_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',
  verification_token TEXT,
  verification_token_expires TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  modules JSONB NOT NULL DEFAULT '["claims"]'::jsonb,
  firm_id UUID,
  is_system_admin BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  accounting_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ecomail_subscriber_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_hours_capacity NUMERIC(8,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_version TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_cancel_token TEXT;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_accounting_user_id ON users(accounting_user_id) WHERE accounting_user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Companies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ico TEXT,
  dic TEXT,
  legal_form TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  email TEXT,
  phone TEXT,
  managing_director TEXT,
  claims_email TEXT,
  claims_phone TEXT,
  status TEXT DEFAULT 'active',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  accounting_company_id UUID,
  source_system TEXT NOT NULL DEFAULT 'claimbuddy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS assigned_accountant_id UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_payer BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_period TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pohoda_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS billing_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reliability_score NUMERIC(8,2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pohoda_years JSONB DEFAULT '[]'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(14,2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS has_employees BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_reporting BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_hourly_rate NUMERIC(12,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS billing_note TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS accounting_start_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS raynet_company_id BIGINT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS health_score NUMERIC(8,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS health_score_breakdown JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS health_score_updated_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS portal_sections JSONB DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS firm_id UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS holding_notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded_date DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS income_invoice_source TEXT;

CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_accounting_company_id ON companies(accounting_company_id) WHERE accounting_company_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Accounting firms (compatibility for shared templates / staff metadata)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounting_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ico TEXT,
  dic TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  logo_url TEXT,
  plan_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  billing_email TEXT,
  signi_api_key TEXT,
  google_drive_credentials JSONB,
  settings JSONB DEFAULT '{}'::jsonb,
  marketplace_provider_id UUID,
  status TEXT DEFAULT 'active',
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_firms_status ON accounting_firms(status);

-- -----------------------------------------------------------------------------
-- Documents (claims company file cabinet)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT,
  type TEXT NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL,
  google_drive_file_id TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  ocr_processed BOOLEAN NOT NULL DEFAULT false,
  ocr_status TEXT DEFAULT 'pending',
  ocr_data JSONB,
  ocr_error TEXT,
  status TEXT DEFAULT 'uploaded',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  upload_source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  document_number TEXT,
  variable_symbol TEXT,
  constant_symbol TEXT,
  supplier_name TEXT,
  supplier_ico TEXT,
  supplier_dic TEXT,
  date_issued DATE,
  date_due DATE,
  date_tax DATE,
  total_without_vat NUMERIC(12,2),
  total_vat NUMERIC(12,2),
  total_with_vat NUMERIC(12,2),
  currency TEXT DEFAULT 'CZK',
  payment_type TEXT,
  confidence_score NUMERIC(5,2),
  accounting_number TEXT,
  bank_account_id UUID,
  search_vector tsvector,
  storage_path TEXT,
  locked_by UUID,
  locked_at TIMESTAMPTZ,
  deleted_by UUID,
  travel_tagged BOOLEAN NOT NULL DEFAULT false,
  travel_session_id UUID
);

CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path) WHERE storage_path IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Monthly closures (claims company accounting context)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  bank_statement_status TEXT,
  bank_statement_uploaded_at TIMESTAMPTZ,
  bank_statement_file_url TEXT,
  expense_invoices_status TEXT,
  expense_invoices_count INT,
  receipts_status TEXT,
  receipts_count INT,
  income_invoices_status TEXT,
  income_invoices_count INT,
  vat_payable NUMERIC(12,2),
  vat_due_date DATE,
  income_tax_accrued NUMERIC(12,2),
  social_insurance_estimate NUMERIC(12,2),
  health_insurance_estimate NUMERIC(12,2),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_accountant_id UUID,
  company_name TEXT,
  vat_status TEXT,
  notes TEXT,
  updated_by UUID,
  social_insurance NUMERIC(12,2),
  health_insurance NUMERIC(12,2),
  cash_income NUMERIC(12,2),
  cash_expense NUMERIC(12,2),
  cash_documents_status TEXT
);

CREATE INDEX IF NOT EXISTS idx_monthly_closures_company_period ON monthly_closures(company_id, period DESC);

-- -----------------------------------------------------------------------------
-- Tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  source TEXT,
  whatsapp_message_id TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  project_id UUID,
  phase_id UUID,
  location_id UUID,
  position_in_phase INT,
  is_next_action BOOLEAN NOT NULL DEFAULT false,
  score_money INT,
  score_fire INT,
  score_time INT,
  score_distance INT,
  score_personal INT,
  is_project BOOLEAN NOT NULL DEFAULT false,
  parent_project_id UUID,
  project_outcome TEXT,
  gtd_context TEXT[],
  gtd_energy_level TEXT,
  gtd_is_quick_action BOOLEAN NOT NULL DEFAULT false,
  created_by_name TEXT,
  assigned_to_name TEXT,
  company_name TEXT,
  is_waiting_for BOOLEAN NOT NULL DEFAULT false,
  waiting_for_who TEXT,
  waiting_for_what TEXT,
  due_time TIME,
  estimated_minutes INT,
  actual_minutes INT DEFAULT 0,
  is_billable BOOLEAN NOT NULL DEFAULT false,
  hourly_rate NUMERIC(12,2),
  billable_hours NUMERIC(12,2) DEFAULT 0,
  invoiced_amount NUMERIC(12,2) DEFAULT 0,
  tags TEXT[],
  progress_percentage INT DEFAULT 0,
  task_data JSONB,
  total_score NUMERIC(8,2),
  position INT,
  deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- Chats & chat messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'company_chat',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL DEFAULT '{}'::uuid[],
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel TEXT,
  subject TEXT,
  status TEXT DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  started_by TEXT,
  waiting_since TIMESTAMPTZ,
  last_responder TEXT
);

CREATE INDEX IF NOT EXISTS idx_chats_company ON chats(company_id);
CREATE INDEX IF NOT EXISTS idx_chats_task ON chats(task_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  text TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_confidence NUMERIC(5,2),
  attachments JSONB DEFAULT '[]'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat ON chat_messages(chat_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- GDPR export log
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gdpr_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'full',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_data_exports_user ON gdpr_data_exports(user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Client memberships
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_client_users_company_id ON client_users(company_id);

-- -----------------------------------------------------------------------------
-- Client invitations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_company_id ON client_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_invitations(invited_email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_invitations_pending_company_email
  ON client_invitations(company_id, invited_email)
  WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- Insurance companies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  ico TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  claims_email TEXT,
  claims_phone TEXT,
  web_url TEXT,
  logo_path TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Insurance cases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  accounting_company_id UUID,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  case_number TEXT NOT NULL,
  policy_number TEXT,
  claim_number TEXT,
  insurance_company_id UUID REFERENCES insurance_companies(id) ON DELETE SET NULL,
  insurance_type TEXT NOT NULL DEFAULT 'other'
    CHECK (insurance_type IN ('auto','property','life','liability','travel','industrial','other')),
  event_date DATE,
  event_description TEXT,
  event_location TEXT,
  claimed_amount NUMERIC(12,2),
  approved_amount NUMERIC(12,2),
  paid_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','gathering_docs','submitted','under_review','additional_info','partially_approved','approved','rejected','appealed','closed','cancelled')),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  deadline DATE,
  note TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_mode TEXT NOT NULL DEFAULT 'self_service'
    CHECK (service_mode IN ('self_service', 'consultation', 'full_representation', 'ai_processing')),
  payment_status TEXT NOT NULL DEFAULT 'not_required',
  payment_id TEXT,
  power_of_attorney_status TEXT NOT NULL DEFAULT 'not_required',
  success_fee_percent NUMERIC(5,2),
  ai_report TEXT,
  ai_processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_cases_number ON insurance_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_company ON insurance_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_accounting_company ON insurance_cases(accounting_company_id) WHERE accounting_company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_cases_assigned ON insurance_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_status ON insurance_cases(status) WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_insurance_cases_insurance ON insurance_cases(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_cases_contact_dedup ON insurance_cases (contact_email, insurance_company_id, created_at) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_cases_contact_user ON insurance_cases(contact_user_id) WHERE contact_user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Case documents
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  document_type TEXT NOT NULL DEFAULT 'other'
    CHECK (document_type IN ('claim_report','photo','expert_report','correspondence','decision','invoice','power_of_attorney','police_report','medical_report','other')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_case_docs ON insurance_case_documents(case_id);

-- -----------------------------------------------------------------------------
-- Case events / timeline
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  visibility TEXT NOT NULL DEFAULT 'internal',
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE insurance_case_events ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE insurance_case_events ADD COLUMN IF NOT EXISTS attachment_url TEXT;

CREATE INDEX IF NOT EXISTS idx_insurance_case_events ON insurance_case_events(case_id);

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'partial'
    CHECK (payment_type IN ('partial','full','advance','refund')),
  payment_date DATE NOT NULL,
  reference TEXT,
  note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insurance_payments_case ON insurance_payments(case_id);

-- -----------------------------------------------------------------------------
-- Claim reviews
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS claim_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  client_name TEXT,
  submitted_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_claim_reviews_case_id ON claim_reviews(case_id);
CREATE INDEX IF NOT EXISTS idx_claim_reviews_token ON claim_reviews(token);

-- -----------------------------------------------------------------------------
-- Minimal signing tables used by claims contracts flow
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurance_case_id UUID REFERENCES insurance_cases(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  signature_type TEXT NOT NULL DEFAULT 'simple',
  status TEXT NOT NULL DEFAULT 'draft',
  note TEXT,
  signi_contract_id TEXT,
  signed_at TIMESTAMPTZ,
  signed_document_path TEXT,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signing_jobs_insurance_case ON signing_jobs(insurance_case_id) WHERE insurance_case_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS signing_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_job_id UUID NOT NULL REFERENCES signing_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'sign',
  status TEXT NOT NULL DEFAULT 'waiting',
  signi_signer_id TEXT,
  signed_at TIMESTAMPTZ,
  rejected_reason TEXT,
  order_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signing_signers_job_id ON signing_signers(signing_job_id);

CREATE TABLE IF NOT EXISTS signing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_job_id UUID NOT NULL REFERENCES signing_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signing_events_job_id ON signing_events(signing_job_id);

-- -----------------------------------------------------------------------------
-- Seed insurance companies
-- -----------------------------------------------------------------------------
INSERT INTO insurance_companies (name, code, ico) VALUES
  ('Česká pojišťovna', 'CP', '45272956'),
  ('Kooperativa pojišťovna', 'KOOP', '47116617'),
  ('Allianz pojišťovna', 'ALLIANZ', '47115971'),
  ('Generali Česká pojišťovna', 'GCP', '45272956'),
  ('ČSOB Pojišťovna', 'CSOB', '45534306'),
  ('UNIQA pojišťovna', 'UNIQA', '49240480'),
  ('Pojišťovna České spořitelny', 'PCS', '47452820'),
  ('Slavia pojišťovna', 'SLAVIA', '60197501'),
  ('Direct pojišťovna', 'DIRECT', '25073958'),
  ('Hasičská vzájemná pojišťovna', 'HVP', '46973079')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Storage bucket expected by ClaimBuddy uploads
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;
