// Types for the accountant firm scraper

export type ScrapedLeadSource = 'ares' | 'firmy.cz' | 'justice.cz'
export type ScrapedLeadStatus = 'new' | 'contacted' | 'converted' | 'rejected' | 'duplicate'

export type ScrapedLead = {
  ico: string
  name: string
  email: string | null
  phone: string | null
  web: string | null
  address: string | null
  city: string | null
  zip: string | null
  nace: string | null
  source: ScrapedLeadSource
  status: ScrapedLeadStatus
}

export type ScraperResult = {
  fetched: number
  inserted: number
  skipped: number  // duplicates
  errors: number
  leads: ScrapedLead[]
}

// NACE 69.20 — Účetnické a auditorské činnosti; daňové poradenství
export const ACCOUNTANT_NACE_CODES = ['6920']

// Keywords for name-based filtering (for sources without NACE)
export const ACCOUNTANT_KEYWORDS = [
  'účetní',
  'účetnictví',
  'daňov',
  'daňové poradenství',
  'audit',
  'bookkeeping',
  'tax',
]
