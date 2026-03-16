-- Add marketing consent tracking to users
-- marketing_emails defaults to true (opt-out model for existing users)
-- New users get explicit opt-in during registration

-- Update notification_preferences default to include marketing_emails
-- (notification_preferences is already JSONB, we just ensure the field exists)

-- Add marketing metadata columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS ecomail_subscriber_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

-- Index for finding users by ecomail subscriber id
CREATE INDEX IF NOT EXISTS idx_users_ecomail_subscriber ON users(ecomail_subscriber_id) WHERE ecomail_subscriber_id IS NOT NULL;

-- Backfill: set marketing_emails = true for all existing active users
-- (they can opt out via notification preferences)
UPDATE users
SET notification_preferences = notification_preferences || '{"marketing_emails": true}'::jsonb
WHERE status = 'active'
  AND (notification_preferences IS NULL OR NOT notification_preferences ? 'marketing_emails');
