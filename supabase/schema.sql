-- ============================================
-- ÚČETNÍ OS - PostgreSQL Schema
-- ============================================
-- Supabase PostgreSQL database schema
-- Includes: tables, indexes, RLS policies, triggers
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: Supabase Auth handles core user data
-- This extends with custom fields

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'accountant', 'admin')),
  phone_number TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Index for role-based queries
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================
-- COMPANIES TABLE
-- ============================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_accountant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  ico TEXT NOT NULL UNIQUE,
  dic TEXT,
  vat_payer BOOLEAN DEFAULT false,
  vat_period TEXT CHECK (vat_period IN ('monthly', 'quarterly', NULL)),
  legal_form TEXT NOT NULL CHECK (legal_form IN ('sro', 'fyzicka_osoba', 'as', 'vos')),
  address JSONB NOT NULL, -- {street, city, zip}
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  pohoda_id TEXT,
  google_drive_folder_id TEXT,
  billing_settings JSONB DEFAULT '{"monthly_fee": 0, "invoice_due_day": 15, "invoice_maturity": 14}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_companies_owner ON public.companies(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_accountant ON public.companies(assigned_accountant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_ico ON public.companies(ico) WHERE deleted_at IS NULL;

-- ============================================
-- MONTHLY_CLOSURES TABLE (MASTER TABLE!)
-- ============================================

CREATE TABLE public.monthly_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_review', 'closed')),

  -- Document statuses
  bank_statement_status TEXT DEFAULT 'missing' CHECK (bank_statement_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  bank_statement_uploaded_at TIMESTAMPTZ,
  bank_statement_file_url TEXT,

  expense_invoices_status TEXT DEFAULT 'missing' CHECK (expense_invoices_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  expense_invoices_count INT DEFAULT 0,

  receipts_status TEXT DEFAULT 'missing' CHECK (receipts_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  receipts_count INT DEFAULT 0,

  income_invoices_status TEXT DEFAULT 'missing' CHECK (income_invoices_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  income_invoices_count INT DEFAULT 0,

  -- Financial data
  vat_payable NUMERIC(10, 2),
  vat_due_date TIMESTAMPTZ,
  income_tax_accrued NUMERIC(10, 2) DEFAULT 0,
  social_insurance_estimate NUMERIC(10, 2),
  health_insurance_estimate NUMERIC(10, 2),

  -- Closure
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.users(id),

  -- Reminders
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one closure per company per period
  UNIQUE(company_id, period)
);

-- CRITICAL INDEX for Master Matrix performance!
CREATE INDEX idx_monthly_closures_company_period ON public.monthly_closures(company_id, period);
CREATE INDEX idx_monthly_closures_period ON public.monthly_closures(period);
CREATE INDEX idx_monthly_closures_status ON public.monthly_closures(status);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  type TEXT NOT NULL CHECK (type IN ('bank_statement', 'receipt', 'expense_invoice', 'income_invoice', 'contract', 'other')),
  file_name TEXT NOT NULL,

  -- Google Drive storage
  google_drive_file_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT,

  -- OCR data
  ocr_processed BOOLEAN DEFAULT false,
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_data JSONB, -- {extracted_text, parsed_fields, confidence}
  ocr_error TEXT,

  -- Status
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('missing', 'uploaded', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Upload metadata
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  upload_source TEXT DEFAULT 'web' CHECK (upload_source IN ('web', 'mobile', 'whatsapp', 'api')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- CRITICAL INDEXES for queries
CREATE INDEX idx_documents_company_period ON public.documents(company_id, period) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON public.documents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_status ON public.documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_ocr_status ON public.documents(ocr_status) WHERE deleted_at IS NULL;

-- ============================================
-- INVOICES TABLE
-- ============================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  invoice_number TEXT NOT NULL,
  variable_symbol TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Partner info
  partner JSONB NOT NULL, -- {name, ico, dic, address}

  -- Items
  items JSONB NOT NULL, -- [{description, quantity, unit_price, vat_rate, total_without_vat, total_with_vat}]

  -- Amounts
  total_without_vat NUMERIC(10, 2) NOT NULL,
  total_vat NUMERIC(10, 2) NOT NULL,
  total_with_vat NUMERIC(10, 2) NOT NULL,

  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'partial')),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(10, 2),

  -- Integrations
  pohoda_id TEXT,
  google_drive_file_id TEXT,

  -- AI generation
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- INDEXES
CREATE INDEX idx_invoices_company_type ON public.invoices(company_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date) WHERE deleted_at IS NULL;

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Source
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'chat', 'ai_generated')),
  whatsapp_message_id UUID,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- INDEXES
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_company ON public.tasks(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE deleted_at IS NULL AND status != 'completed';

-- ============================================
-- CHATS & MESSAGES
-- ============================================

CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('company_chat', 'task_chat')),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chats_company ON public.chats(company_id);
CREATE INDEX idx_chats_task ON public.chats(task_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'accountant', 'ai')),
  text TEXT NOT NULL,

  -- AI info
  ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT,
  ai_confidence NUMERIC(3, 2),

  attachments JSONB DEFAULT '[]'::jsonb,

  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id, created_at DESC);

-- ============================================
-- WHATSAPP MESSAGES
-- ============================================

CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whatsapp_message_id TEXT NOT NULL UNIQUE,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'audio')),
  text TEXT,
  media_url TEXT,

  -- AI processing
  ai_processed BOOLEAN DEFAULT false,
  ai_extracted_intent TEXT,

  -- Task creation
  task_created BOOLEAN DEFAULT false,
  task_id UUID REFERENCES public.tasks(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_company ON public.whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(from_phone);

-- ============================================
-- REMINDERS (SMS/Email)
-- ============================================

CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  recipient TEXT NOT NULL, -- email or phone
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered BOOLEAN DEFAULT false,
  delivery_status TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id)
);

CREATE INDEX idx_reminders_company_period ON public.reminders(company_id, period);

-- ============================================
-- PAYMENT MATCHES
-- ============================================

CREATE TABLE public.payment_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_statement_id UUID REFERENCES public.documents(id),
  invoice_id UUID REFERENCES public.invoices(id),

  -- Transaction data
  transaction_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  variable_symbol TEXT,
  account_name TEXT,

  -- Matching
  matched BOOLEAN DEFAULT false,
  matched_by TEXT CHECK (matched_by IN ('ai', 'manual')),
  confidence NUMERIC(3, 2),

  -- Review
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_matches_company ON public.payment_matches(company_id);
CREATE INDEX idx_payment_matches_invoice ON public.payment_matches(invoice_id);

-- ============================================
-- AUDIT LOG (Security!)
-- ============================================

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_table ON public.audit_log(table_name, record_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_closures_updated_at BEFORE UPDATE ON public.monthly_closures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_matches ENABLE ROW LEVEL SECURITY;

-- USERS: Everyone can view their own user
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- COMPANIES: Clients see own, accountants see all
CREATE POLICY "Clients can view own company" ON public.companies
  FOR SELECT USING (
    owner_id = auth.uid()
    OR assigned_accountant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

CREATE POLICY "Accountants can update companies" ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- MONTHLY_CLOSURES: Follow company access
CREATE POLICY "Users can view closures for accessible companies" ON public.monthly_closures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = monthly_closures.company_id
      AND (
        owner_id = auth.uid()
        OR assigned_accountant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

-- DOCUMENTS: Follow company access
CREATE POLICY "Users can view documents for accessible companies" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = documents.company_id
      AND (
        owner_id = auth.uid()
        OR assigned_accountant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

CREATE POLICY "Clients can upload own documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = documents.company_id AND owner_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Add as needed for invoices, tasks, chats, etc.)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to insert document and update closure atomically
CREATE OR REPLACE FUNCTION insert_document_and_update_closure(
  p_company_id UUID,
  p_period TEXT,
  p_document_data JSONB,
  p_document_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
  v_status_column TEXT;
BEGIN
  -- Insert document
  INSERT INTO public.documents (
    company_id, period, type, file_name, google_drive_file_id,
    mime_type, uploaded_by, uploaded_at
  ) VALUES (
    p_company_id, p_period,
    p_document_data->>'type',
    p_document_data->>'file_name',
    p_document_data->>'google_drive_file_id',
    p_document_data->>'mime_type',
    auth.uid(),
    NOW()
  ) RETURNING id INTO v_document_id;

  -- Determine which status column to update
  v_status_column := CASE p_document_type
    WHEN 'bank_statement' THEN 'bank_statement_status'
    WHEN 'receipt' THEN 'receipts_status'
    WHEN 'expense_invoice' THEN 'expense_invoices_status'
    WHEN 'income_invoice' THEN 'income_invoices_status'
    ELSE NULL
  END;

  -- Update monthly_closure if applicable
  IF v_status_column IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.monthly_closures SET %I = $1, updated_at = NOW() WHERE company_id = $2 AND period = $3',
      v_status_column
    ) USING 'uploaded', p_company_id, p_period;
  END IF;

  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

