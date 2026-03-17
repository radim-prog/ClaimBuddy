-- Claim reviews: star rating + text feedback from clients
CREATE TABLE IF NOT EXISTS claim_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES insurance_cases(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  client_name TEXT,
  submitted_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX idx_claim_reviews_case_id ON claim_reviews(case_id);
CREATE INDEX idx_claim_reviews_token ON claim_reviews(token);

-- RLS off — accessed via service_role only
ALTER TABLE claim_reviews ENABLE ROW LEVEL SECURITY;
