-- Notion↔App task sync mapping table
-- Tracks bidirectional sync state between Notion pages and app tasks

CREATE TABLE IF NOT EXISTS notion_sync_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT UNIQUE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_notion_updated TIMESTAMPTZ,
  last_app_updated TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'notion_ahead', 'app_ahead', 'conflict', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notion_sync_task_id ON notion_sync_mapping(task_id);
CREATE INDEX idx_notion_sync_status ON notion_sync_mapping(sync_status);
