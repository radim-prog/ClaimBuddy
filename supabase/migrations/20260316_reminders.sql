-- Reminder system: recurring reminders with delivery tracking and escalation
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'missing_docs', 'unpaid_invoice', 'custom')),
  message TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'adaptive' CHECK (frequency IN ('daily', 'every_3_days', 'weekly', 'biweekly', 'adaptive')),
  escalation_level INT NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'resolved', 'expired')),
  channels TEXT[] NOT NULL DEFAULT '{in_app}',
  metadata JSONB DEFAULT '{}',
  max_deliveries INT DEFAULT 20,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms', 'telegram')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'skipped')),
  escalation_level INT NOT NULL DEFAULT 0,
  message_text TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_company_status ON reminders(company_id, status);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminder_deliveries_reminder ON reminder_deliveries(reminder_id);
CREATE INDEX idx_reminder_deliveries_scheduled ON reminder_deliveries(scheduled_at, status);
