-- Monetization: subscriptions, plan_limits, usage_credits, usage_log
-- + ALTER users with stripe_customer_id and plan_tier

-- subscriptions: who has which plan
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  portal_type TEXT NOT NULL CHECK (portal_type IN ('accountant', 'client')),
  plan_tier TEXT NOT NULL DEFAULT 'free',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', NULL)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'incomplete')),
  trial_end DATE,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portal_type)
);

-- plan_limits: configurable per-tier limits (editable without deploy)
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_type TEXT NOT NULL,
  plan_tier TEXT NOT NULL,
  max_companies INTEGER,
  max_users INTEGER,
  max_extractions_month INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  UNIQUE(portal_type, plan_tier)
);

-- usage_credits: prepaid credits (extraction, randomizer)
CREATE TABLE IF NOT EXISTS public.usage_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  credit_type TEXT NOT NULL,
  total_credits INTEGER NOT NULL DEFAULT 0,
  used_credits INTEGER NOT NULL DEFAULT 0,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, credit_type, period)
);

-- usage_log: audit trail
CREATE TABLE IF NOT EXISTS public.usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Denormalized fields on users for fast token access
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_credits_user_period ON public.usage_credits(user_id, credit_type, period);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_created ON public.usage_log(user_id, created_at DESC);

-- Seed plan_limits: accountant portal
INSERT INTO public.plan_limits (portal_type, plan_tier, max_companies, max_users, max_extractions_month, features) VALUES
  ('accountant', 'free', 5, 1, 0, '{
    "clients_list": true, "time_tracking": true, "payment_overview": true, "deadlines": true, "basic_tasks": true,
    "messages": false, "closures": false, "vat": false, "income_tax": false, "client_groups": false,
    "projects": false, "client_invoicing": false, "extraction": false, "full_cases": false, "analytics": false
  }'::jsonb),
  ('accountant', 'starter', 15, 2, 0, '{
    "clients_list": true, "time_tracking": true, "payment_overview": true, "deadlines": true, "basic_tasks": true,
    "messages": true, "closures": true, "vat": true, "income_tax": false, "client_groups": false,
    "projects": false, "client_invoicing": false, "extraction": false, "full_cases": false, "analytics": false
  }'::jsonb),
  ('accountant', 'professional', 100, 5, 0, '{
    "clients_list": true, "time_tracking": true, "payment_overview": true, "deadlines": true, "basic_tasks": true,
    "messages": true, "closures": true, "vat": true, "income_tax": true, "client_groups": true,
    "projects": true, "client_invoicing": true, "extraction": false, "full_cases": false, "analytics": false
  }'::jsonb),
  ('accountant', 'enterprise', NULL, NULL, 100, '{
    "clients_list": true, "time_tracking": true, "payment_overview": true, "deadlines": true, "basic_tasks": true,
    "messages": true, "closures": true, "vat": true, "income_tax": true, "client_groups": true,
    "projects": true, "client_invoicing": true, "extraction": true, "full_cases": true, "analytics": true
  }'::jsonb)
ON CONFLICT (portal_type, plan_tier) DO NOTHING;

-- Seed plan_limits: client portal
INSERT INTO public.plan_limits (portal_type, plan_tier, max_companies, max_users, max_extractions_month, features) VALUES
  ('client', 'free', NULL, NULL, 0, '{
    "dashboard": true, "messages": true, "document_upload": true, "basic_invoicing": true, "travel_basic": true,
    "address_book": false, "extraction": false, "travel_randomizer": false
  }'::jsonb),
  ('client', 'basic', NULL, NULL, 5, '{
    "dashboard": true, "messages": true, "document_upload": true, "basic_invoicing": true, "travel_basic": true,
    "address_book": true, "extraction": true, "travel_randomizer": false
  }'::jsonb),
  ('client', 'premium', NULL, NULL, 20, '{
    "dashboard": true, "messages": true, "document_upload": true, "basic_invoicing": true, "travel_basic": true,
    "address_book": true, "extraction": true, "travel_randomizer": true
  }'::jsonb)
ON CONFLICT (portal_type, plan_tier) DO NOTHING;

-- Migrate existing users: admin → enterprise, accountant/assistant → professional (90d trial), client → free
UPDATE public.users SET plan_tier = 'enterprise' WHERE role = 'admin' AND (plan_tier IS NULL OR plan_tier = 'free');

-- Create subscriptions for existing admin users
INSERT INTO public.subscriptions (user_id, portal_type, plan_tier, status)
SELECT id, 'accountant', 'enterprise', 'active'
FROM public.users WHERE role = 'admin'
ON CONFLICT (user_id, portal_type) DO NOTHING;

-- Create subscriptions for accountant/assistant users with 90-day trial
INSERT INTO public.subscriptions (user_id, portal_type, plan_tier, status, trial_end)
SELECT id, 'accountant', 'professional', 'trialing', CURRENT_DATE + INTERVAL '90 days'
FROM public.users WHERE role IN ('accountant', 'assistant')
ON CONFLICT (user_id, portal_type) DO NOTHING;

UPDATE public.users SET plan_tier = 'professional' WHERE role IN ('accountant', 'assistant') AND (plan_tier IS NULL OR plan_tier = 'free');

-- Create subscriptions for client users
INSERT INTO public.subscriptions (user_id, portal_type, plan_tier, status)
SELECT id, 'client', 'free', 'active'
FROM public.users WHERE role = 'client'
ON CONFLICT (user_id, portal_type) DO NOTHING;
