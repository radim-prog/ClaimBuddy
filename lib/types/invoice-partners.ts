export interface InvoicePartner {
  id: string
  company_id: string
  name: string
  ico?: string | null
  dic?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  email?: string | null
  phone?: string | null
  bank_account?: string | null
  iban?: string | null
  note?: string | null
  usage_count: number
}
