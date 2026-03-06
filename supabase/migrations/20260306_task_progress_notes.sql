-- Task Progress Notes - průběžné poznámky k jednotlivým úkolům

CREATE TABLE IF NOT EXISTS public.task_progress_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id),
    author_name TEXT,
    current_status TEXT NOT NULL,
    problems TEXT,
    next_steps TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_progress_notes_task
    ON public.task_progress_notes(task_id, created_at DESC);

ALTER TABLE public.task_progress_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'task_progress_notes'
      AND policyname = 'Accountants full access'
  ) THEN
    CREATE POLICY "Accountants full access" ON public.task_progress_notes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.users
          WHERE users.id = auth.uid()
            AND users.role IN ('accountant', 'admin')
        )
      );
  END IF;
END $$;

