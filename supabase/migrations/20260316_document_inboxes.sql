-- Document inboxes — each company gets a unique email slug for receiving documents
CREATE TABLE IF NOT EXISTS document_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  slug VARCHAR(10) NOT NULL UNIQUE,
  email_address VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_inboxes_company ON document_inboxes(company_id);
CREATE INDEX idx_document_inboxes_slug ON document_inboxes(slug);

-- Document inbox items — individual attachments extracted from emails
CREATE TABLE IF NOT EXISTS document_inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID NOT NULL REFERENCES document_inboxes(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_message_id VARCHAR(255),
  from_address VARCHAR(255),
  from_name VARCHAR(255),
  subject VARCHAR(500),
  received_at TIMESTAMPTZ,
  filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  storage_path VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  document_id UUID REFERENCES documents(id),
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_document_inbox_items_inbox ON document_inbox_items(inbox_id);
CREATE INDEX idx_document_inbox_items_company ON document_inbox_items(company_id);
CREATE INDEX idx_document_inbox_items_status ON document_inbox_items(status);

-- Status values: pending, processing, imported, failed, ignored
