-- Timeline event visibility + attachments
ALTER TABLE insurance_case_events
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal','client','all'));

ALTER TABLE insurance_case_events
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
