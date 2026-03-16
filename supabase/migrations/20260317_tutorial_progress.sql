-- Tutorial progress tracking for onboarding tutorials
CREATE TABLE IF NOT EXISTS tutorial_progress (
  user_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, step_id)
);

-- RLS
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tutorial progress"
  ON tutorial_progress FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own tutorial progress"
  ON tutorial_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own tutorial progress"
  ON tutorial_progress FOR DELETE
  USING (true);
