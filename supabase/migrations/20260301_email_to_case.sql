-- ============================================
-- EMAIL TO CASE
-- Inboxes, emails, auto-assignment rules
-- ============================================

CREATE TABLE IF NOT EXISTS public.case_email_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address TEXT NOT NULL UNIQUE,
  display_name TEXT,
  provider TEXT DEFAULT 'gmail',
  is_active BOOLEAN DEFAULT true,
  config JSONB,  -- provider-specific config (label, last_sync_at, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID REFERENCES public.case_email_inboxes(id),
  external_message_id TEXT UNIQUE,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_address TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Assignment
  project_id UUID REFERENCES public.projects(id),
  company_id UUID REFERENCES public.companies(id),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'unassigned'
    CHECK (status IN ('unassigned','assigned','ignored','auto_assigned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.case_email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('sender','subject','domain')),
  match_value TEXT NOT NULL,
  target_project_id UUID REFERENCES public.projects(id),
  target_company_id UUID REFERENCES public.companies(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_emails_status ON public.case_emails(status);
CREATE INDEX IF NOT EXISTS idx_case_emails_project ON public.case_emails(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_case_emails_external_id ON public.case_emails(external_message_id);
