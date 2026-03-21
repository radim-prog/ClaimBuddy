-- Reminders compatibility: add missing columns for activities feed
-- Migration: 2026-03-18

-- Add missing columns to reminders table
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS recipient TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE;
ALTER TABLE reminders ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Relax type constraint if it exists (allow custom reminder types)
DO $$
BEGIN
  -- Drop old check constraint if exists
  ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_type_check;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
