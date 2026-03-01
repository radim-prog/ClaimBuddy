-- ============================================
-- CASE CLIENT VISIBILITY
-- Allows accountants to control which cases/entries are visible to clients
-- ============================================

-- Master toggle on project: is this case visible to the client?
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_visible_tabs JSONB DEFAULT '["timeline","documents"]'::jsonb;

-- Per-entry visibility on timeline
ALTER TABLE public.case_timeline
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT true;

-- Per-document visibility
ALTER TABLE public.case_documents
  ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT true;

-- Index for efficient client-side queries
CREATE INDEX IF NOT EXISTS idx_projects_client_visible
  ON public.projects(company_id, client_visible) WHERE client_visible = true AND is_case = true;
