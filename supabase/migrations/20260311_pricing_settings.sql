-- Pricing settings table (replaces localStorage)
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
