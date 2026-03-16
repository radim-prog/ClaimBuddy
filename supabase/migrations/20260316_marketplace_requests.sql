-- Marketplace matchmaking requests (client → accountant provider)
CREATE TABLE IF NOT EXISTS marketplace_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES marketplace_providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  business_type TEXT,
  budget_range TEXT,
  rejection_reason TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketplace_requests_provider ON marketplace_requests(provider_id, status);
CREATE INDEX idx_marketplace_requests_client ON marketplace_requests(client_user_id);

-- Prevent duplicate pending requests from same client to same provider
CREATE UNIQUE INDEX idx_marketplace_requests_unique_pending
  ON marketplace_requests(client_user_id, provider_id)
  WHERE status = 'pending';
