-- ============================================================================
-- Case Progress Notes - "Lékařský zápis" styl poznámek k průběhu spisu
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_progress_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id),
    author_name TEXT NOT NULL,
    current_status TEXT NOT NULL,
    problems TEXT,
    next_steps TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_case_progress_notes_project
    ON public.case_progress_notes(project_id, created_at DESC);

ALTER TABLE public.case_progress_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accountants full access" ON public.case_progress_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('admin', 'accountant', 'assistant')
        )
    );
