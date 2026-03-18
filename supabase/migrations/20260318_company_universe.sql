-- Company Universe: ownership graph, layout positions, notes
-- Migration: 2026-03-18

-- 1. Extend companies table with holding-specific columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'standalone';
-- Values: person, holding, subholding, daughter, granddaughter, standalone, external
ALTER TABLE companies ADD COLUMN IF NOT EXISTS holding_notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded_date DATE;

-- 2. Company ownership links (core graph edges)
CREATE TABLE IF NOT EXISTS company_ownership (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  child_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  share_percentage DECIMAL(5,2) DEFAULT 100.00 CHECK (share_percentage > 0 AND share_percentage <= 100),
  relationship_type TEXT DEFAULT 'ownership' CHECK (relationship_type IN ('ownership', 'management', 'advisory')),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE, -- NULL = current/active
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent self-ownership
  CONSTRAINT no_self_ownership CHECK (parent_company_id != child_company_id),
  -- One active ownership per child (a company can only have one parent at a time)
  CONSTRAINT unique_active_ownership UNIQUE (child_company_id, valid_to)
);

CREATE INDEX IF NOT EXISTS idx_company_ownership_parent ON company_ownership(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_ownership_child ON company_ownership(child_company_id);
CREATE INDEX IF NOT EXISTS idx_company_ownership_active ON company_ownership(valid_to) WHERE valid_to IS NULL;

-- 3. Per-user graph layout (positions, bubbles, zoom state)
CREATE TABLE IF NOT EXISTS company_graph_layout (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layout_type TEXT DEFAULT 'galaxy' CHECK (layout_type IN ('galaxy', 'tree', 'matrix')),
  positions JSONB DEFAULT '{}',   -- {company_id: {x, y, fx, fy}}
  bubbles JSONB DEFAULT '[]',     -- [{id, name, color, x, y, radius}]
  zoom_state JSONB,               -- {k, x, y} for D3 zoom transform
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, layout_type)
);

-- 4. Company notes with timeline
CREATE TABLE IF NOT EXISTS company_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  mentions UUID[] DEFAULT '{}', -- company_ids referenced in note
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_notes_company ON company_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_notes_author ON company_notes(author_id);
