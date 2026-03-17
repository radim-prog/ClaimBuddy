-- Link invoices to billing_invoices for auto-generated billing invoices
-- This allows the billing-as-a-service pipeline to bridge into the main invoices table

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_invoice_id UUID REFERENCES billing_invoices(id);

-- Index for quick lookup when marking paid
CREATE INDEX IF NOT EXISTS idx_invoices_billing_invoice_id ON invoices(billing_invoice_id) WHERE billing_invoice_id IS NOT NULL;
