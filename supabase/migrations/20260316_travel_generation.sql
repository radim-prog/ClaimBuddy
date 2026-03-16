-- Travel Generation System — 5 new tables + ALTER existing
-- Part of TASK-008: Travel Book Generator

-- 1. Generation sessions (main session table)
CREATE TABLE IF NOT EXISTS travel_generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  period_start TEXT NOT NULL, -- 'YYYY-MM'
  period_end TEXT NOT NULL,   -- 'YYYY-MM'
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'documents_selected', 'fuel_verified', 'vehicles_configured', 'generating', 'generated', 'reviewed', 'exported', 'failed')),
  input_snapshot JSONB,
  ai_model TEXT,
  ai_tokens_input INTEGER DEFAULT 0,
  ai_tokens_output INTEGER DEFAULT 0,
  ai_calls_count INTEGER DEFAULT 0,
  ai_total_cost_czk NUMERIC(10,2) DEFAULT 0,
  distance_source TEXT DEFAULT 'ai_estimate'
    CHECK (distance_source IN ('ai_estimate', 'osrm', 'google_maps', 'manual')),
  total_trips INTEGER DEFAULT 0,
  total_km NUMERIC(10,1) DEFAULT 0,
  total_reimbursement NUMERIC(10,2) DEFAULT 0,
  credits_consumed INTEGER DEFAULT 0,
  validation_score NUMERIC(5,2),
  validation_issues JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tgs_company ON travel_generation_sessions(company_id);
CREATE INDEX idx_tgs_status ON travel_generation_sessions(status);

-- 2. Fuel data extracted from documents
CREATE TABLE IF NOT EXISTS travel_generation_fuel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES travel_generation_sessions(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES travel_vehicles(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  liters NUMERIC(8,2) NOT NULL,
  price_per_liter NUMERIC(8,2),
  total_price NUMERIC(10,2),
  odometer INTEGER,
  station_name TEXT,
  source TEXT NOT NULL DEFAULT 'ocr'
    CHECK (source IN ('ocr', 'manual', 'existing_fuel_log')),
  confidence NUMERIC(3,2) DEFAULT 0,
  raw_ocr_fields JSONB,
  manually_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tgfd_session ON travel_generation_fuel_data(session_id);

-- 3. Odometer readings per vehicle per session
CREATE TABLE IF NOT EXISTS travel_generation_odometer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES travel_generation_sessions(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES travel_vehicles(id) ON DELETE CASCADE,
  odometer_start INTEGER NOT NULL,
  odometer_end INTEGER NOT NULL,
  expected_km NUMERIC(10,1),
  actual_km NUMERIC(10,1) GENERATED ALWAYS AS (odometer_end - odometer_start) STORED,
  deviation_pct NUMERIC(5,2),
  UNIQUE(session_id, vehicle_id)
);

-- 4. Driver availability per session
CREATE TABLE IF NOT EXISTS travel_generation_driver_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES travel_generation_sessions(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES travel_drivers(id) ON DELETE CASCADE,
  total_working_days INTEGER DEFAULT 0,
  vacation_days JSONB DEFAULT '[]'::jsonb, -- array of date strings
  sick_days JSONB DEFAULT '[]'::jsonb,     -- array of date strings
  available_days INTEGER DEFAULT 0,
  UNIQUE(session_id, driver_id)
);

-- 5. Distance cache (OSRM/Google Maps results)
CREATE TABLE IF NOT EXISTS travel_distance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_normalized TEXT NOT NULL,
  destination_normalized TEXT NOT NULL,
  distance_km NUMERIC(8,1) NOT NULL,
  duration_minutes INTEGER,
  route_description TEXT,
  source TEXT NOT NULL DEFAULT 'osrm'
    CHECK (source IN ('osrm', 'google_maps', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(origin_normalized, destination_normalized, source)
);

CREATE INDEX idx_tdc_lookup ON travel_distance_cache(origin_normalized, destination_normalized);

-- ALTER existing tables
ALTER TABLE documents ADD COLUMN IF NOT EXISTS travel_tagged BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS travel_session_id UUID REFERENCES travel_generation_sessions(id);
ALTER TABLE travel_trips ADD COLUMN IF NOT EXISTS generation_session_id UUID REFERENCES travel_generation_sessions(id);
ALTER TABLE travel_trips ADD COLUMN IF NOT EXISTS generation_order INTEGER;
