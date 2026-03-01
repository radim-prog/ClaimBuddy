-- ============================================
-- DOCUMENT VERSIONING
-- Version chain via parent_document_id, audit trail via case_document_changes
-- ============================================

ALTER TABLE public.case_documents
  ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES public.case_documents(id),
  ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS change_summary TEXT;

CREATE TABLE IF NOT EXISTS public.case_document_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.case_documents(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_by_name TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created','replaced','metadata_changed','visibility_changed')),
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_document_changes_doc
  ON public.case_document_changes(document_id);

CREATE INDEX IF NOT EXISTS idx_case_documents_parent
  ON public.case_documents(parent_document_id) WHERE parent_document_id IS NOT NULL;
