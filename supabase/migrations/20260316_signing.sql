-- Electronic signing via Signi.com

-- Signing templates (DOCX templates with placeholders)
CREATE TABLE IF NOT EXISTS signing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  file_path TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signing jobs
CREATE TABLE IF NOT EXISTS signing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  template_id UUID REFERENCES signing_templates(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'contract'
    CHECK (document_type IN ('contract','amendment','power_of_attorney','mandate','price_addendum','other')),
  signi_contract_id TEXT,
  signature_type TEXT NOT NULL DEFAULT 'simple'
    CHECK (signature_type IN ('simple','drawn','bank_id_sign','qualified')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','partially_signed','signed','rejected','expired','error','cancelled')),
  note TEXT,
  signed_at TIMESTAMPTZ,
  signed_document_path TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signing signers
CREATE TABLE IF NOT EXISTS signing_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_job_id UUID NOT NULL REFERENCES signing_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'sign' CHECK (role IN ('sign','approve')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','signed','rejected','expired')),
  signi_signer_id TEXT,
  signed_at TIMESTAMPTZ,
  rejected_reason TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signing events (audit trail)
CREATE TABLE IF NOT EXISTS signing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signing_job_id UUID NOT NULL REFERENCES signing_jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signi API key per user
ALTER TABLE users ADD COLUMN IF NOT EXISTS signi_api_key TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signing_jobs_company ON signing_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_signing_jobs_status ON signing_jobs(status) WHERE status IN ('draft','pending');
CREATE INDEX IF NOT EXISTS idx_signing_jobs_created_by ON signing_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_signing_jobs_signi ON signing_jobs(signi_contract_id) WHERE signi_contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signing_signers_job ON signing_signers(signing_job_id);
CREATE INDEX IF NOT EXISTS idx_signing_events_job ON signing_events(signing_job_id);
CREATE INDEX IF NOT EXISTS idx_signing_templates_active ON signing_templates(active) WHERE active = true;
