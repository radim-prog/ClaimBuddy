// ARES (Administrativní registr ekonomických subjektů) API client
// Docs: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest

const ARES_BASE = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest'

export type AresCompanyData = {
  ico: string
  dic: string | null
  name: string
  legal_form: string
  legal_form_code: string
  address: {
    street: string
    city: string
    zip: string
  }
  created_at: string | null
  vat_payer: boolean
}

// Map ARES legal form codes to Czech labels
const LEGAL_FORM_MAP: Record<string, string> = {
  '101': 'Fyzická osoba',
  '111': 'Veřejná obchodní společnost',
  '112': 'Společnost s ručením omezeným',
  '113': 'Společnost komanditní',
  '117': 'Nadace',
  '118': 'Nadační fond',
  '121': 'Akciová společnost',
  '141': 'Obecně prospěšná společnost',
  '145': 'Společenství vlastníků jednotek',
  '205': 'Družstvo',
  '301': 'Státní podnik',
  '421': 'OSVČ',
  '706': 'Spolek',
  '801': 'Obec',
  '804': 'Kraj',
  '906': 'Zahraniční osoba',
}

function mapLegalForm(code: string): string {
  if (LEGAL_FORM_MAP[code]) return LEGAL_FORM_MAP[code]
  // Common cases
  if (code === '112') return 's.r.o.'
  if (code === '121') return 'a.s.'
  if (code === '101' || code === '421') return 'OSVČ'
  if (code === '205') return 'družstvo'
  return code
}

function mapLegalFormShort(code: string): string {
  switch (code) {
    case '112': return 's.r.o.'
    case '121': return 'a.s.'
    case '111': return 'v.o.s.'
    case '113': return 'k.s.'
    case '101':
    case '421': return 'OSVČ'
    case '205': return 'družstvo'
    default: return LEGAL_FORM_MAP[code] || code
  }
}

export function validateIco(ico: string): boolean {
  if (!/^\d{8}$/.test(ico)) return false
  // Czech IČO checksum validation
  const weights = [8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += parseInt(ico[i]) * weights[i]
  }
  const remainder = sum % 11
  let check: number
  if (remainder === 0) check = 1
  else if (remainder === 1) check = 0
  else check = 11 - remainder
  return check === parseInt(ico[7])
}

export async function lookupByIco(ico: string): Promise<AresCompanyData | null> {
  const res = await fetch(`${ARES_BASE}/ekonomicke-subjekty/${ico}`, {
    headers: { 'Accept': 'application/json' },
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ARES API error: ${res.status}`)

  const data = await res.json()

  // Parse address from sidlo
  const sidlo = data.sidlo || {}
  const street = [sidlo.nazevUlice, sidlo.cisloDomovni ? `${sidlo.cisloDomovni}${sidlo.cisloOrientacni ? '/' + sidlo.cisloOrientacni : ''}` : '']
    .filter(Boolean).join(' ')
  const city = sidlo.nazevObce || ''
  const zip = sidlo.psc ? String(sidlo.psc) : ''

  const legalFormCode = String(data.pravniForma || '')

  return {
    ico: data.ico,
    dic: data.dic || null,
    name: data.obchodniJmeno || '',
    legal_form: mapLegalFormShort(legalFormCode),
    legal_form_code: legalFormCode,
    address: { street, city, zip },
    created_at: data.datumVzniku || null,
    vat_payer: !!data.dic,
  }
}

export type AresSearchResult = {
  ico: string
  name: string
  address: string
}

export async function searchByName(query: string, limit = 10): Promise<AresSearchResult[]> {
  const res = await fetch(`${ARES_BASE}/ekonomicke-subjekty/vyhledat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      obchodniJmeno: query,
      start: 0,
      pocet: limit,
    }),
  })

  if (!res.ok) throw new Error(`ARES search error: ${res.status}`)

  const data = await res.json()
  const items = data.ekonomickeSubjekty || []

  return items.map((item: any) => ({
    ico: item.ico,
    name: item.obchodniJmeno || '',
    address: item.sidlo?.textovaAdresa || '',
  }))
}
