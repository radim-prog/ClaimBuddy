-- Invoice Partners (address book) + Invoice type extensions
-- Partners = reusable customer/supplier contacts per company

-- 1. Address book for invoice partners
CREATE TABLE IF NOT EXISTS invoice_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  ico TEXT,
  dic TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'CZ',
  email TEXT,
  phone TEXT,
  bank_account TEXT,
  iban TEXT,
  note TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_partners_company ON invoice_partners(company_id);

-- 2. Extend invoices table with new columns
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS issued_by TEXT,
  ADD COLUMN IF NOT EXISTS issued_by_phone TEXT,
  ADD COLUMN IF NOT EXISTS issued_by_email TEXT,
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES invoice_partners(id),
  ADD COLUMN IF NOT EXISTS converted_from_id UUID REFERENCES invoices(id),
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice';

-- document_type values: 'invoice' | 'proforma' | 'credit_note'
