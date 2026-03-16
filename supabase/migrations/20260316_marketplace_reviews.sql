-- Marketplace reviews (client rates their accountant provider)
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verified_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One review per client per provider
CREATE UNIQUE INDEX idx_marketplace_reviews_unique
  ON marketplace_reviews(provider_id, reviewer_user_id);

CREATE INDEX idx_marketplace_reviews_provider ON marketplace_reviews(provider_id);
