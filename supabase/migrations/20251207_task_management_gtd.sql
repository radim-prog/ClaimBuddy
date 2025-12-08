-- ============================================
-- TASK MANAGEMENT - GTD System Migration
-- ============================================
-- Created: 2025-12-07
-- Purpose: Implement GTD-based task management with time tracking and invoicing
-- ============================================

-- ============================================
-- 1. DROP & RECREATE TASKS TABLE (GTD Enhanced)
-- ============================================

-- Drop existing tasks table and recreate with GTD fields
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Základní info
  title TEXT NOT NULL,
  description TEXT,

  -- GTD: Task vs. Project
  is_project BOOLEAN DEFAULT false,
  project_outcome TEXT, -- Project outcome description
  parent_project_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending',
    'clarifying',
    'accepted',
    'in_progress',
    'waiting_for',
    'waiting_client',
    'completed',
    'cancelled',
    'someday_maybe',
    'invoiced'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Assignování & Delegování
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  delegated_from UUID REFERENCES public.users(id) ON DELETE SET NULL,
  delegated_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  delegation_reason TEXT,

  -- Waiting For
  is_waiting_for BOOLEAN DEFAULT false,
  waiting_for_who TEXT,
  waiting_for_what TEXT,
  last_reminded_at TIMESTAMPTZ,

  -- Acceptance
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,

  -- Deadline
  due_date DATE,
  due_time TIME,

  -- Vazby (VŽDY company_id!)
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  monthly_closure_id UUID REFERENCES public.monthly_closures(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  onboarding_client_id UUID, -- Reference to onboarding clients if that table exists

  -- TIME TRACKING
  estimated_minutes INT, -- Odhad od zadavatele
  actual_minutes INT DEFAULT 0, -- Skutečný čas od realizátora
  time_tracking_started_at TIMESTAMPTZ, -- Kdy začal pracovat

  -- FAKTURACE
  is_billable BOOLEAN DEFAULT false, -- Je to fakturovatelné klientovi?
  hourly_rate NUMERIC(10,2), -- Hodinová sazba (Kč/hod)
  billable_hours NUMERIC(10,2) DEFAULT 0, -- Vyfakturovatelné hodiny
  invoiced_amount NUMERIC(10,2) DEFAULT 0, -- Již vyfakturováno
  last_invoiced_at TIMESTAMPTZ, -- Kdy naposledy fakturováno
  invoice_period TEXT, -- Fakturační období (2025-12)

  -- GTD Specific
  gtd_context TEXT[], -- @telefon, @email, @počítač
  gtd_energy_level TEXT CHECK (gtd_energy_level IN ('high', 'medium', 'low')),
  gtd_is_quick_action BOOLEAN DEFAULT false, -- < 2 min!

  -- Metadata
  tags TEXT[],
  progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  task_data JSONB, -- Additional flexible data

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 2. TIME TRACKING ENTRIES TABLE (NOVÁ)
-- ============================================

CREATE TABLE public.time_tracking_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES public.task_checklist_items(id) ON DELETE CASCADE,

  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  stopped_at TIMESTAMPTZ,
  duration_minutes INT, -- Auto-calculated by trigger
  note TEXT, -- Co dělal
  billable BOOLEAN DEFAULT false, -- Je to fakturovatelné?

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: must reference either task_id or checklist_item_id, but not both
  CHECK (
    (task_id IS NOT NULL AND checklist_item_id IS NULL) OR
    (task_id IS NULL AND checklist_item_id IS NOT NULL)
  )
);

-- ============================================
-- 3. TASK CHECKLIST ITEMS TABLE
-- ============================================

CREATE TABLE public.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,

  -- Deadline & assignování
  due_date DATE,
  due_time TIME,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,

  -- Time tracking pro každý krok
  estimated_minutes INT,
  actual_minutes INT DEFAULT 0,

  -- GTD
  gtd_context TEXT,

  -- Completion tracking
  completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TASK INVOICES TABLE (NOVÁ)
-- ============================================

CREATE TABLE public.task_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  invoice_period TEXT NOT NULL, -- '2025-12'
  total_hours NUMERIC(10,2) NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  invoice_data JSONB -- Detailní rozpis
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Tasks indexes
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to, status) WHERE completed_at IS NULL;
CREATE INDEX idx_tasks_company ON public.tasks(company_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_tasks_parent_project ON public.tasks(parent_project_id) WHERE parent_project_id IS NOT NULL;
CREATE INDEX idx_tasks_is_project ON public.tasks(is_project) WHERE is_project = true;
CREATE INDEX idx_tasks_gtd_context ON public.tasks USING GIN(gtd_context);
CREATE INDEX idx_tasks_is_billable ON public.tasks(is_billable) WHERE is_billable = true;
CREATE INDEX idx_tasks_invoice_period ON public.tasks(invoice_period) WHERE invoice_period IS NOT NULL;
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Time tracking indexes
CREATE INDEX idx_time_tracking_task_id ON public.time_tracking_entries(task_id);
CREATE INDEX idx_time_tracking_checklist_item ON public.time_tracking_entries(checklist_item_id);
CREATE INDEX idx_time_tracking_user_id ON public.time_tracking_entries(user_id);
CREATE INDEX idx_time_tracking_started_at ON public.time_tracking_entries(started_at);

-- Checklist indexes
CREATE INDEX idx_checklist_task_id ON public.task_checklist_items(task_id);
CREATE INDEX idx_checklist_assigned_to ON public.task_checklist_items(assigned_to) WHERE completed = false;

-- Invoice indexes
CREATE INDEX idx_task_invoices_task_id ON public.task_invoices(task_id);
CREATE INDEX idx_task_invoices_company_id ON public.task_invoices(company_id);
CREATE INDEX idx_task_invoices_period ON public.task_invoices(invoice_period);
CREATE INDEX idx_task_invoices_status ON public.task_invoices(status);

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger: Auto-calculate duration for time tracking entries
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stopped_at IS NOT NULL THEN
    NEW.duration_minutes := ROUND(EXTRACT(EPOCH FROM (NEW.stopped_at - NEW.started_at)) / 60);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_tracking_calculate_duration
  BEFORE INSERT OR UPDATE ON public.time_tracking_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_duration();

-- Trigger: Update task actual_minutes when time tracking entry is added/updated
CREATE OR REPLACE FUNCTION update_task_actual_minutes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update task actual_minutes by summing all entries
  UPDATE public.tasks
  SET
    actual_minutes = COALESCE((
      SELECT SUM(duration_minutes)
      FROM public.time_tracking_entries
      WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
        AND duration_minutes IS NOT NULL
    ), 0),
    billable_hours = COALESCE((
      SELECT SUM(duration_minutes) / 60.0
      FROM public.time_tracking_entries
      WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
        AND duration_minutes IS NOT NULL
        AND billable = true
    ), 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_time_on_entry_insert
  AFTER INSERT ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (NEW.task_id IS NOT NULL AND NEW.duration_minutes IS NOT NULL)
  EXECUTE FUNCTION update_task_actual_minutes();

CREATE TRIGGER update_task_time_on_entry_update
  AFTER UPDATE ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (NEW.task_id IS NOT NULL AND NEW.duration_minutes IS NOT NULL)
  EXECUTE FUNCTION update_task_actual_minutes();

CREATE TRIGGER update_task_time_on_entry_delete
  AFTER DELETE ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (OLD.task_id IS NOT NULL)
  EXECUTE FUNCTION update_task_actual_minutes();

-- Trigger: Update checklist item actual_minutes
CREATE OR REPLACE FUNCTION update_checklist_actual_minutes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update checklist item actual_minutes by summing all entries
  UPDATE public.task_checklist_items
  SET
    actual_minutes = COALESCE((
      SELECT SUM(duration_minutes)
      FROM public.time_tracking_entries
      WHERE checklist_item_id = COALESCE(NEW.checklist_item_id, OLD.checklist_item_id)
        AND duration_minutes IS NOT NULL
    ), 0)
  WHERE id = COALESCE(NEW.checklist_item_id, OLD.checklist_item_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_time_on_entry_insert
  AFTER INSERT ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (NEW.checklist_item_id IS NOT NULL AND NEW.duration_minutes IS NOT NULL)
  EXECUTE FUNCTION update_checklist_actual_minutes();

CREATE TRIGGER update_checklist_time_on_entry_update
  AFTER UPDATE ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (NEW.checklist_item_id IS NOT NULL AND NEW.duration_minutes IS NOT NULL)
  EXECUTE FUNCTION update_checklist_actual_minutes();

CREATE TRIGGER update_checklist_time_on_entry_delete
  AFTER DELETE ON public.time_tracking_entries
  FOR EACH ROW
  WHEN (OLD.checklist_item_id IS NOT NULL)
  EXECUTE FUNCTION update_checklist_actual_minutes();

-- Trigger: Update task updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update project progress based on subtasks
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_total_subtasks INT;
  v_completed_subtasks INT;
  v_progress INT;
BEGIN
  -- Get parent project ID
  v_parent_id := COALESCE(NEW.parent_project_id, OLD.parent_project_id);

  IF v_parent_id IS NOT NULL THEN
    -- Count total and completed subtasks
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total_subtasks, v_completed_subtasks
    FROM public.tasks
    WHERE parent_project_id = v_parent_id;

    -- Calculate progress percentage
    IF v_total_subtasks > 0 THEN
      v_progress := ROUND((v_completed_subtasks::NUMERIC / v_total_subtasks) * 100);
    ELSE
      v_progress := 0;
    END IF;

    -- Update parent project
    UPDATE public.tasks
    SET
      progress_percentage = v_progress,
      updated_at = NOW()
    WHERE id = v_parent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_progress_on_subtask_change
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  WHEN (NEW.parent_project_id IS NOT NULL OR OLD.parent_project_id IS NOT NULL)
  EXECUTE FUNCTION update_project_progress();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_invoices ENABLE ROW LEVEL SECURITY;

-- TASKS: Users can see tasks they created, are assigned to, or have access via company
CREATE POLICY "Users can view tasks for accessible companies" ON public.tasks
  FOR SELECT USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR delegated_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = tasks.company_id
      AND (
        owner_id = auth.uid()
        OR assigned_accountant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = tasks.company_id
      AND (
        owner_id = auth.uid()
        OR assigned_accountant_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can update their own tasks or assigned tasks" ON public.tasks
  FOR UPDATE USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR delegated_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- TIME TRACKING ENTRIES: Users can only see/modify their own entries
CREATE POLICY "Users can view own time tracking entries" ON public.time_tracking_entries
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = time_tracking_entries.task_id
      AND (
        created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can create own time tracking entries" ON public.time_tracking_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own time tracking entries" ON public.time_tracking_entries
  FOR UPDATE USING (user_id = auth.uid());

-- CHECKLIST ITEMS: Follow task access
CREATE POLICY "Users can view checklist items for accessible tasks" ON public.task_checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_checklist_items.task_id
      AND (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR delegated_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.companies
          WHERE id = tasks.company_id
          AND (
            owner_id = auth.uid()
            OR assigned_accountant_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.users
              WHERE id = auth.uid() AND role IN ('accountant', 'admin')
            )
          )
        )
      )
    )
  );

CREATE POLICY "Users can create checklist items for accessible tasks" ON public.task_checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_checklist_items.task_id
      AND (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can update checklist items for accessible tasks" ON public.task_checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_checklist_items.task_id
      AND (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR assigned_to_name IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
      )
    )
  );

-- TASK INVOICES: Only accountants and admins
CREATE POLICY "Accountants can view task invoices" ON public.task_invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = task_invoices.company_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Accountants can create task invoices" ON public.task_invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

CREATE POLICY "Accountants can update task invoices" ON public.task_invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('accountant', 'admin')
    )
  );

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function to get billable summary for a company in a period
CREATE OR REPLACE FUNCTION get_billable_summary(
  p_company_id UUID,
  p_period TEXT
)
RETURNS TABLE (
  total_hours NUMERIC,
  total_amount NUMERIC,
  tasks_count INT,
  invoiced_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(billable_hours), 0) as total_hours,
    COALESCE(SUM(billable_hours * hourly_rate), 0) as total_amount,
    COUNT(*)::INT as tasks_count,
    COALESCE(SUM(invoiced_amount), 0) as invoiced_amount
  FROM public.tasks
  WHERE company_id = p_company_id
    AND is_billable = true
    AND (invoice_period = p_period OR invoice_period IS NULL)
    AND completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Tables created:
-- - tasks (GTD-enhanced with time tracking and billing)
-- - time_tracking_entries (detailed time logs)
-- - task_checklist_items (checklist with deadlines)
-- - task_invoices (monthly billing)
--
-- Features implemented:
-- - GTD methodology (projects, contexts, energy levels, 2-min rule)
-- - Time tracking with auto-calculate duration
-- - Monthly invoicing for billable projects
-- - Task delegation and waiting-for
-- - Automatic progress calculation for projects
-- ============================================
