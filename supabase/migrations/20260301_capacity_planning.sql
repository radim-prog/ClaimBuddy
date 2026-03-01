-- ============================================
-- CAPACITY PLANNING
-- Weekly hours, per-day schedule, overrides (vacation, sick leave)
-- ============================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS weekly_hours_capacity NUMERIC(5,2) DEFAULT 40,
  ADD COLUMN IF NOT EXISTS work_schedule JSONB
    DEFAULT '{"mon":8,"tue":8,"wed":8,"thu":8,"fri":8,"sat":0,"sun":0}'::jsonb;

CREATE TABLE IF NOT EXISTS public.user_capacity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  daily_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  reason TEXT,  -- vacation, sick_leave, part_time, training
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_capacity_overrides_user
  ON public.user_capacity_overrides(user_id, date_from, date_to);
