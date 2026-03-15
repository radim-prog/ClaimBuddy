-- Extraction presence tracking for real-time collaboration
CREATE TABLE IF NOT EXISTS public.extraction_presence (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  page TEXT NOT NULL DEFAULT 'verify',
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

CREATE INDEX idx_extraction_presence_heartbeat
  ON extraction_presence(last_heartbeat);

CREATE INDEX idx_extraction_presence_document
  ON extraction_presence(document_id)
  WHERE document_id IS NOT NULL;

-- Soft locking columns on documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

CREATE INDEX idx_documents_locked
  ON documents(locked_by)
  WHERE locked_by IS NOT NULL;
