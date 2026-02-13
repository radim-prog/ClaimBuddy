-- ============================================================================
-- Case Management System Migration
-- Adds spisový systém (case management) to existing projects
-- ============================================================================

-- ============================================================================
-- STEP 1: Create case_types table FIRST (before FK reference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT 'blue',
    description TEXT,
    default_hourly_rate NUMERIC(10,2),
    template_phases JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Add case fields to existing projects table
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_case BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS case_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS case_type_id UUID REFERENCES public.case_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS case_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS case_closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS case_opposing_party TEXT,
  ADD COLUMN IF NOT EXISTS case_reference TEXT,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2) DEFAULT 1500;

-- ============================================================================
-- STEP 3: Create case_timeline table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'note', 'document', 'email', 'phone_call', 'meeting',
        'deadline', 'status_change', 'task_completed', 'invoice_sent',
        'state_filing', 'client_request', 'internal'
    )),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_by_name TEXT,
    event_date TIMESTAMPTZ DEFAULT NOW(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    document_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Create case_documents table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    file_size_bytes INT,
    category TEXT DEFAULT 'other' CHECK (category IN (
        'contract', 'invoice', 'correspondence', 'state_document',
        'tax_return', 'financial_report', 'evidence', 'other'
    )),
    version INT DEFAULT 1,
    description TEXT,
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_case_timeline_project_date
  ON public.case_timeline(project_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_case_documents_project
  ON public.case_documents(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_is_case
  ON public.projects(is_case) WHERE is_case = true;

-- ============================================================================
-- STEP 6: Sequence and trigger for case_number (SP-YYYY-NNN)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    seq_num INT;
    new_number TEXT;
BEGIN
    IF NEW.is_case = true AND NEW.case_number IS NULL THEN
        year_part := to_char(CURRENT_DATE, 'YYYY');
        seq_num := nextval('case_number_seq');
        new_number := 'SP-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');

        WHILE EXISTS (SELECT 1 FROM public.projects WHERE case_number = new_number) LOOP
            seq_num := nextval('case_number_seq');
            new_number := 'SP-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
        END LOOP;

        NEW.case_number := new_number;
        NEW.case_opened_at := COALESCE(NEW.case_opened_at, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_case_number ON public.projects;
CREATE TRIGGER trigger_generate_case_number
    BEFORE INSERT OR UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION generate_case_number();

-- ============================================================================
-- STEP 7: Default case types
-- ============================================================================

INSERT INTO public.case_types (name, icon, color, description, default_hourly_rate, template_phases)
VALUES
    ('Klientská zakázka', 'briefcase', 'blue', 'Standardní účetní práce pro klienta', 1500,
     '[{"title": "Analýza", "order": 1}, {"title": "Zpracování", "order": 2}, {"title": "Kontrola", "order": 3}, {"title": "Dokončení", "order": 4}]'::jsonb),
    ('Daňová kontrola', 'shield-alert', 'red', 'Daňová kontrola nebo inspekce', 2000,
     '[{"title": "Příprava", "order": 1}, {"title": "Kontrola", "order": 2}, {"title": "Vyřízení připomínek", "order": 3}, {"title": "Uzavření", "order": 4}]'::jsonb),
    ('Účetní uzávěrka', 'calendar-check', 'green', 'Roční účetní uzávěrka', 1800,
     '[{"title": "Příprava dokladů", "order": 1}, {"title": "Zpracování uzávěrky", "order": 2}, {"title": "Opravy", "order": 3}, {"title": "Finální kontrola", "order": 4}]'::jsonb),
    ('Ostatní', 'folder', 'gray', 'Ostatní administrativní spisy', 1200,
     '[{"title": "Příjem", "order": 1}, {"title": "Zpracování", "order": 2}, {"title": "Archivace", "order": 3}]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 8: RLS
-- ============================================================================

ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;

-- case_types: readable by all, writable by accountant/admin
CREATE POLICY "Anyone can read case_types" ON public.case_types
    FOR SELECT USING (true);

CREATE POLICY "Accountants can manage case_types" ON public.case_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
    );

-- case_timeline: accountant/admin access
CREATE POLICY "Accountants can view case_timeline" ON public.case_timeline
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
    );

CREATE POLICY "Accountants can manage case_timeline" ON public.case_timeline
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
    );

-- case_documents: accountant/admin access
CREATE POLICY "Accountants can view case_documents" ON public.case_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
    );

CREATE POLICY "Accountants can manage case_documents" ON public.case_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role IN ('accountant', 'admin')
        )
    );
