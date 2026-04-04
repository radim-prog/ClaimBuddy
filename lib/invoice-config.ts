// Supplier configuration for invoice PDF generation
// Server-side: use getSupplierInfo() from lib/supplier-loader.ts (loads from app_settings DB with this as fallback)
// Client-side: uses this static export directly (see app/client/billing/page.tsx)

export interface SupplierInfo {
  name: string
  ico: string
  dic: string
  address: string
  city: string
  zip: string
  email: string
  phone: string
  bankAccount: string
  iban: string
  registration: string
  web?: string
  logo_url?: string
  signature_url?: string
}

// Fill in with actual company data
export const SUPPLIER: SupplierInfo = {
  name: 'Zajcon Consulting s.r.o.',
  ico: '09426132',
  dic: 'CZ09426132',
  address: 'Na Poříčí 1041/12',
  city: 'Praha 1',
  zip: '110 00',
  email: 'info@zajcon.cz',
  phone: '+420 777 888 999',
  bankAccount: '2702078793/2010',
  iban: 'CZ8920100000002702078793',
  registration: 'C 335789 vedená u Městského soudu v Praze',
  web: 'https://app.zajcon.cz',
}
