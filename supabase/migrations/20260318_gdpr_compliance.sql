-- GDPR compliance: consent tracking, account deletion
-- Migration: 2026-03-18

-- 1. Registration consent
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gdpr_consent_version TEXT;

-- 2. Account deletion support
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_cancel_token TEXT;

-- 3. Data export audit log
CREATE TABLE IF NOT EXISTS gdpr_data_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  export_type TEXT NOT NULL DEFAULT 'full' CHECK (export_type IN ('full', 'partial')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  file_size_bytes BIGINT
);

-- 4. Account deletion audit log
CREATE TABLE IF NOT EXISTS gdpr_deletion_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('requested', 'cancelled', 'completed')),
  anonymized_tables TEXT[],
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_deletion_pending
  ON users(deletion_requested_at) WHERE status = 'deletion_pending';
