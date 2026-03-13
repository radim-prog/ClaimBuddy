-- Add position column for subtask ordering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

-- Backfill: order existing subtasks by created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY parent_project_id
    ORDER BY created_at ASC
  ) - 1 AS pos
  FROM public.tasks
  WHERE parent_project_id IS NOT NULL
)
UPDATE public.tasks SET position = ranked.pos
FROM ranked WHERE public.tasks.id = ranked.id;

-- Index for efficient subtask ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(parent_project_id, position);
