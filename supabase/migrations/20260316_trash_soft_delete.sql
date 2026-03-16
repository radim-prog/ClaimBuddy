-- TASK-007: Soft-delete support for trash/recycle bin

-- Add deleted_at/deleted_by to projects (currently uses status='deleted')
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add deleted_at/deleted_by to invoice_partners (currently hard-deleted)
ALTER TABLE invoice_partners ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_partners ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add deleted_by to existing tables that have deleted_at but not deleted_by
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Partial indexes for trash queries (deleted items)
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON invoices(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_partners_deleted ON invoice_partners(deleted_at) WHERE deleted_at IS NOT NULL;

-- Trash retention settings (per-company or global)
CREATE TABLE IF NOT EXISTS trash_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  retention_days INT NOT NULL DEFAULT 30 CHECK (retention_days IN (30, 60, 90)),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Add trash_restore feature to plan_limits
-- Professional and Enterprise get it, Free and Starter don't
UPDATE plan_limits
SET features = features || '{"trash_restore": true}'::jsonb
WHERE portal_type = 'accountant' AND plan_tier IN ('professional', 'enterprise');

UPDATE plan_limits
SET features = features || '{"trash_restore": false}'::jsonb
WHERE portal_type = 'accountant' AND plan_tier IN ('free', 'starter');
