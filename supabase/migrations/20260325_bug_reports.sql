CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_role text,
  description text NOT NULL,
  category text,
  url text,
  user_agent text,
  viewport text,
  client_logs jsonb DEFAULT '[]',
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'wont_fix')),
  resolution_note text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read all" ON bug_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can insert" ON bug_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update" ON bug_reports FOR UPDATE USING (true);
