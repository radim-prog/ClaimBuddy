// ARES scraper — fetches accounting/tax advisory firms via ARES REST API v3
// NACE 6920 = Účetnické a auditorské činnosti; daňové poradenství
// Docs: https://ares.gov.cz/ekonomicke-subjekty-v-be/rest

import { RateLimiter, withRetry } from './rate-limiter'
import type { ScrapedLead } from './types'

const ARES_BASE = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest'
const BATCH_SIZE = 100  // ARES max per request
const limiter = new RateLimiter(1)  // 1 req/s

type AresSubject = {
  ico: string
  obchodniJmeno: string
  sidlo?: {
    nazevUlice?: string
    cisloDomovni?: string
    cisloOrientacni?: string
    nazevObce?: string
    psc?: number | string
    textovaAdresa?: string
  }
  nace?: string[]
}

// Search ARES for companies with given NACE codes, paginated
export async function* fetchAresAccountants(
  naceCodes: string[],
  maxPages = 50
): AsyncGenerator<ScrapedLead[]> {
  let page = 0

  while (page < maxPages) {
    await limiter.throttle()

    const body = {
      nace: naceCodes,
      start: page * BATCH_SIZE,
      pocet: BATCH_SIZE,
    }

    let data: { ekonomickeSubjekty?: AresSubject[]; pocetCelkem?: number }

    try {
      data = await withRetry(async () => {
        const res = await fetch(`${ARES_BASE}/ekonomicke-subjekty/vyhledat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'UcetniOS-Scraper/1.0 (info@zajcon.cz)',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) throw new Error(`ARES HTTP ${res.status}`)
        return res.json()
      })
    } catch (err) {
      console.error(`[ARES] Page ${page} failed:`, err)
      break
    }

    const subjects = data.ekonomickeSubjekty ?? []
    if (subjects.length === 0) break

    const leads: ScrapedLead[] = subjects.map((s) => {
      const sidlo = s.sidlo ?? {}
      const streetParts = [
        sidlo.nazevUlice,
        sidlo.cisloDomovni
          ? `${sidlo.cisloDomovni}${sidlo.cisloOrientacni ? '/' + sidlo.cisloOrientacni : ''}`
          : undefined,
      ].filter(Boolean)

      return {
        ico: s.ico,
        name: s.obchodniJmeno || '',
        email: null,       // ARES doesn't provide contacts
        phone: null,
        web: null,
        address: streetParts.join(' ') || sidlo.textovaAdresa || null,
        city: sidlo.nazevObce || null,
        zip: sidlo.psc ? String(sidlo.psc) : null,
        nace: (s.nace ?? []).join(',') || naceCodes.join(','),
        source: 'ares' as const,
        status: 'new' as const,
      }
    })

    yield leads

    // Stop if we got less than a full page
    if (subjects.length < BATCH_SIZE) break
    page++
  }
}

// Enrich a single company detail from ARES (gets more fields than vyhledat)
export async function enrichFromAres(ico: string): Promise<Partial<ScrapedLead>> {
  await limiter.throttle()

  try {
    const data = await withRetry(async () => {
      const res = await fetch(`${ARES_BASE}/ekonomicke-subjekty/${ico}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'UcetniOS-Scraper/1.0 (info@zajcon.cz)',
        },
        signal: AbortSignal.timeout(10_000),
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`ARES HTTP ${res.status}`)
      return res.json()
    })

    if (!data) return {}

    const sidlo = data.sidlo ?? {}
    return {
      web: data.www || null,
      email: data.email || null,
      phone: data.telefon || null,
      city: sidlo.nazevObce || null,
      zip: sidlo.psc ? String(sidlo.psc) : null,
    }
  } catch {
    return {}
  }
}
