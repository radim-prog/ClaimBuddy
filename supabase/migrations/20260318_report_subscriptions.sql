-- Auto-report email subscriptions
-- Users can subscribe to periodic reports (weekly/monthly)

CREATE TABLE IF NOT EXISTS report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly_summary', 'monthly_summary', 'dph_status', 'payment_status')),
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'monthly')),
  email TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, report_type)
);

-- Index for cron queries
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_enabled
  ON report_subscriptions (enabled, frequency) WHERE enabled = true;

-- RLS
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own report subscriptions"
  ON report_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);
