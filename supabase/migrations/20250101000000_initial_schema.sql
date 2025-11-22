-- Účetní OS - Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'accountant', 'admin')),
  phone_number TEXT,
  avatar_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_accountant_id UUID NOT NULL REFERENCES public.users(id),
  name TEXT NOT NULL,
  ico TEXT NOT NULL UNIQUE,
  dic TEXT,
  vat_payer BOOLEAN DEFAULT FALSE,
  vat_period TEXT CHECK (vat_period IN ('monthly', 'quarterly') OR vat_period IS NULL),
  legal_form TEXT NOT NULL CHECK (legal_form IN ('sro', 'fyzicka_osoba', 'as', 'vos')),
  address JSONB NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  pohoda_id TEXT,
  google_drive_folder_id TEXT,
  billing_settings JSONB DEFAULT '{"monthly_fee": 2000, "invoice_due_day": 15, "invoice_maturity": 14}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Closures (KLÍČOVÁ TABULKA pro matrici)
CREATE TABLE public.monthly_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_review', 'closed')),

  -- Statusy podkladů
  bank_statement_status TEXT NOT NULL DEFAULT 'missing' CHECK (bank_statement_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  bank_statement_uploaded_at TIMESTAMP WITH TIME ZONE,
  bank_statement_file_url TEXT,

  expense_invoices_status TEXT NOT NULL DEFAULT 'missing' CHECK (expense_invoices_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  expense_invoices_count INTEGER DEFAULT 0,

  receipts_status TEXT NOT NULL DEFAULT 'missing' CHECK (receipts_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  receipts_count INTEGER DEFAULT 0,

  income_invoices_status TEXT NOT NULL DEFAULT 'missing' CHECK (income_invoices_status IN ('missing', 'uploaded', 'approved', 'rejected')),
  income_invoices_count INTEGER DEFAULT 0,

  -- Finanční výpočty
  vat_payable DECIMAL(12, 2),
  vat_due_date TIMESTAMP WITH TIME ZONE,
  income_tax_accrued DECIMAL(12, 2) DEFAULT 0,
  social_insurance_estimate DECIMAL(12, 2),
  health_insurance_estimate DECIMAL(12, 2),

  -- Uzavření
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES public.users(id),

  -- Urgence
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(company_id, period)
);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  type TEXT NOT NULL CHECK (type IN ('bank_statement', 'receipt', 'expense_invoice', 'contract', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  google_drive_file_id TEXT,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,

  -- OCR
  ocr_processed BOOLEAN DEFAULT FALSE,
  ocr_data JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('missing', 'uploaded', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  upload_source TEXT NOT NULL CHECK (upload_source IN ('web', 'mobile', 'whatsapp', 'api'))
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  invoice_number TEXT NOT NULL,
  variable_symbol TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Partner
  partner JSONB NOT NULL,

  -- Položky
  items JSONB NOT NULL,

  -- Částky
  total_without_vat DECIMAL(12, 2) NOT NULL,
  total_vat DECIMAL(12, 2) NOT NULL,
  total_with_vat DECIMAL(12, 2) NOT NULL,

  -- Platba
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'partial')),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(12, 2),

  -- Integrace
  pohoda_id TEXT,
  google_drive_file_id TEXT,

  -- AI
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Zdroj
  source TEXT NOT NULL CHECK (source IN ('manual', 'whatsapp', 'chat', 'ai_generated')),
  whatsapp_message_id TEXT,

  attachments JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('company_chat', 'task_chat')),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'accountant', 'ai')),
  text TEXT NOT NULL,

  -- AI info
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  ai_confidence DECIMAL(3, 2),

  attachments JSONB DEFAULT '[]'::jsonb,

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Messages
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
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_extracted_intent TEXT,

  -- Task creation
  task_created BOOLEAN DEFAULT FALSE,
  task_id UUID REFERENCES public.tasks(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Matches
CREATE TABLE public.payment_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_statement_id UUID NOT NULL REFERENCES public.documents(id),
  invoice_id UUID REFERENCES public.invoices(id),

  -- Transaction data
  transaction_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  variable_symbol TEXT,
  account_name TEXT,

  -- Matching
  matched BOOLEAN DEFAULT FALSE,
  matched_by TEXT CHECK (matched_by IN ('ai', 'manual')),
  confidence DECIMAL(3, 2),

  -- Review
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- 'YYYY-MM'
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE,
  delivery_status TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id)
);

-- Indexes for performance
CREATE INDEX idx_monthly_closures_company ON public.monthly_closures(company_id);
CREATE INDEX idx_monthly_closures_period ON public.monthly_closures(period);
CREATE INDEX idx_monthly_closures_status ON public.monthly_closures(status);
CREATE INDEX idx_documents_company ON public.documents(company_id);
CREATE INDEX idx_documents_period ON public.documents(period);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_chat_messages_chat ON public.chat_messages(chat_id);
CREATE INDEX idx_whatsapp_messages_company ON public.whatsapp_messages(company_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_closures_updated_at BEFORE UPDATE ON public.monthly_closures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: vidí sami sebe nebo účetní vidí všechny
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Accountants can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- Companies: klient vidí své, účetní vidí všechny
CREATE POLICY "Clients can view own companies" ON public.companies
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Accountants can view all companies" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

CREATE POLICY "Accountants can manage companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- Monthly Closures: podle company ownership
CREATE POLICY "View own company closures" ON public.monthly_closures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Accountants view all closures" ON public.monthly_closures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

CREATE POLICY "Accountants manage closures" ON public.monthly_closures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- Documents: podle company ownership
CREATE POLICY "View own company documents" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Upload own company documents" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = company_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Accountants manage all documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- Tasks: assigned_to nebo created_by nebo accountant
CREATE POLICY "View assigned tasks" ON public.tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

CREATE POLICY "Accountants manage tasks" ON public.tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );
