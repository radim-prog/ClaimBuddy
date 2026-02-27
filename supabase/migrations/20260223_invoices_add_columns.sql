-- Add missing columns to invoices table for full CRUD support
-- These columns are referenced by the API but were missing from the schema

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS period TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS task_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);

-- Backfill period from issue_date for existing rows
UPDATE public.invoices SET period = to_char(issue_date, 'YYYY-MM') WHERE period IS NULL AND issue_date IS NOT NULL;
-- Backfill tax_date from issue_date
UPDATE public.invoices SET tax_date = issue_date WHERE tax_date IS NULL AND issue_date IS NOT NULL;

-- Index for period-based queries (the existing API already queries by period)
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.invoices(period) WHERE deleted_at IS NULL;
