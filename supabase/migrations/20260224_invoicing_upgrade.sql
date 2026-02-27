-- Invoicing upgrade: item templates + invoice extra columns
-- Date: 2026-02-24

-- 1) Invoice item templates (ceník / oblíbené položky)
CREATE TABLE IF NOT EXISTS public.invoice_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'ks',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 21,
  category TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_templates_active
  ON public.invoice_item_templates(is_active, sort_order);

-- 2) Extra columns on invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS number_series_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS constant_symbol TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS specific_symbol TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS footer_text TEXT;
