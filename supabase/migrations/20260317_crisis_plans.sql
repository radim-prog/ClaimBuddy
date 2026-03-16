-- Crisis plans per company
CREATE TABLE IF NOT EXISTS crisis_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  -- Company profile for AI generation
  industry TEXT NOT NULL DEFAULT 'other'
    CHECK (industry IN ('manufacturing','services','it_saas','retail','construction','logistics','healthcare','agriculture','other')),
  employee_count_range TEXT DEFAULT '1-5'
    CHECK (employee_count_range IN ('1-5','6-20','21-50','51-200','200+')),
  annual_revenue_range TEXT,
  key_dependencies TEXT,          -- co firma nejvíc potřebuje k fungování (volný text)
  biggest_fear TEXT,              -- čeho se majitel nejvíc bojí (volný text)

  -- Generated plan
  plan_data JSONB,                -- AI-generated structured plan (risks array)
  plan_generated_at TIMESTAMPTZ,
  plan_model TEXT,                -- which AI model generated it

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generated','reviewed','archived')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crisis plan risks (individual risk items)
CREATE TABLE IF NOT EXISTS crisis_plan_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES crisis_plans(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'operational',
  description TEXT,

  -- Simplified FMEA (1-10 scale)
  severity INT NOT NULL DEFAULT 5 CHECK (severity BETWEEN 1 AND 10),
  occurrence INT NOT NULL DEFAULT 5 CHECK (occurrence BETWEEN 1 AND 10),
  detection INT NOT NULL DEFAULT 5 CHECK (detection BETWEEN 1 AND 10),
  rpn INT GENERATED ALWAYS AS (severity * occurrence * detection) STORED,

  -- Actions
  action_immediate TEXT,          -- co udělat hned
  action_preventive TEXT,         -- jak předejít
  early_warning TEXT,             -- varovné signály

  -- Severity levels
  level_yellow TEXT,              -- žlutý alert
  level_red TEXT,                 -- červený alert

  -- Meta
  owner TEXT,                     -- kdo je zodpovědný
  sort_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crisis_plans_company ON crisis_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_crisis_plan_risks_plan ON crisis_plan_risks(plan_id);
