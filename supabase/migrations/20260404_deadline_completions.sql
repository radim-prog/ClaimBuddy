-- Deadline completions persistence (TASK-128 P5)
CREATE TABLE IF NOT EXISTS deadline_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id TEXT NOT NULL,
  completed_by UUID NOT NULL REFERENCES users(id),
  completed_by_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  firm_id UUID REFERENCES accounting_firms(id),
  UNIQUE(deadline_id, firm_id)
);

CREATE INDEX IF NOT EXISTS idx_deadline_completions_firm ON deadline_completions(firm_id);
