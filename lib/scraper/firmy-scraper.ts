// Firmy.cz scraper — extracts accounting firm listings from category pages
// Category: Finanční služby > Účetní a daňové služby
// Rate-limited to 1 req/s, respects robots.txt spirit (public data only)

import { RateLimiter, withRetry } from './rate-limiter'
import type { ScrapedLead } from './types'

const BASE_URL = 'https://www.firmy.cz'
const CATEGORY_PATH = '/Financni-sluzby/Ucetni-a-danove-sluzby'
const limiter = new RateLimiter(1)

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; UcetniOS-Scraper/1.0; +https://app.zajcon.cz)',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'cs-CZ,cs;q=0.9',
}

// Extract text between two markers — lightweight HTML parsing without regex on user input
function extract(html: string, before: string, after: string): string | null {
  const start = html.indexOf(before)
  if (start === -1) return null
  const valueStart = start + before.length
  const end = html.indexOf(after, valueStart)
  if (end === -1) return null
  return html
    .slice(valueStart, end)
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

// Parse firm cards from a Firmy.cz listing page
function parseListingPage(html: string): Array<{ name: string; detailUrl: string }> {
  const results: Array<{ name: string; detailUrl: string }> = []
  // Each firm card has href="/detail/..." with class containing companyTitle
  const segments = html.split('class="companyTitle"')
  for (let i = 1; i < segments.length; i++) {
    // Look backwards for the href
    const before = segments[i - 1]
    const hrefIdx = before.lastIndexOf('href="/detail/')
    if (hrefIdx === -1) continue
    const hrefStart = hrefIdx + 6 // skip 'href="'
    const hrefEnd = before.indexOf('"', hrefStart)
    if (hrefEnd === -1) continue
    const detailPath = before.slice(hrefStart, hrefEnd)
    // Name is between > and < in segments[i]
    const nameStart = segments[i].indexOf('>')
    const nameEnd = segments[i].indexOf('<', nameStart + 1)
    if (nameStart === -1 || nameEnd === -1) continue
    const name = segments[i].slice(nameStart + 1, nameEnd).trim()
    if (name && detailPath.startsWith('/detail/')) {
      results.push({ detailUrl: BASE_URL + detailPath, name })
    }
  }
  return results
}

// Parse a Firmy.cz company detail page for contact info
function parseDetailPage(html: string): Partial<ScrapedLead> {
  const result: Partial<ScrapedLead> = {}

  // Phone: tel: link
  const telIdx = html.indexOf('href="tel:')
  if (telIdx !== -1) {
    const telStart = telIdx + 10
    const telEnd = html.indexOf('"', telStart)
    if (telEnd !== -1) {
      result.phone = html
        .slice(telStart, telEnd)
        .replace(/\s/g, '')
        .replace(/^00420/, '+420')
    }
  }

  // Email: mailto: link
  const mailIdx = html.indexOf('href="mailto:')
  if (mailIdx !== -1) {
    const mailStart = mailIdx + 13
    const mailEnd = html.indexOf('"', mailStart)
    if (mailEnd !== -1) {
      const raw = html.slice(mailStart, mailEnd).split('?')[0]
      if (raw.includes('@')) result.email = raw.trim()
    }
  }

  // IČO: 8-digit number after "IČ" label
  const icoLabelIdx = html.search(/I[ČC][OO]?[^:]*:/)
  if (icoLabelIdx !== -1) {
    const after = html.slice(icoLabelIdx, icoLabelIdx + 40)
    const icoMatch = after.match(/\d{8}/)
    if (icoMatch) result.ico = icoMatch[0]
  }

  // City
  const cityRaw = extract(html, 'itemprop="addressLocality">', '<')
  if (cityRaw) result.city = cityRaw

  // ZIP
  const zipRaw = extract(html, 'itemprop="postalCode">', '<')
  if (zipRaw) result.zip = zipRaw.replace(/\s/g, '')

  // Street address
  const streetRaw = extract(html, 'itemprop="streetAddress">', '<')
  if (streetRaw) result.address = streetRaw

  return result
}

// Generator: yields batches of leads from Firmy.cz category pages
export async function* fetchFirmyAccountants(
  maxPages = 20
): AsyncGenerator<ScrapedLead[]> {
  for (let page = 1; page <= maxPages; page++) {
    await limiter.throttle()

    const url =
      page === 1
        ? `${BASE_URL}${CATEGORY_PATH}`
        : `${BASE_URL}${CATEGORY_PATH}?page=${page}`

    let listingHtml: string
    try {
      listingHtml = await withRetry(async () => {
        const res = await fetch(url, {
          headers: HEADERS,
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) throw new Error(`Firmy.cz HTTP ${res.status}`)
        return res.text()
      })
    } catch (err) {
      console.error(`[Firmy.cz] Page ${page} failed:`, err)
      break
    }

    const listings = parseListingPage(listingHtml)
    if (listings.length === 0) break

    const leads: ScrapedLead[] = []

    for (const listing of listings) {
      await limiter.throttle()
      try {
        const detailHtml = await withRetry(async () => {
          const res = await fetch(listing.detailUrl, {
            headers: HEADERS,
            signal: AbortSignal.timeout(10_000),
          })
          if (!res.ok) throw new Error(`Firmy.cz detail HTTP ${res.status}`)
          return res.text()
        })
        const detail = parseDetailPage(detailHtml)
        leads.push({
          ico: detail.ico ?? '',
          name: listing.name,
          email: detail.email ?? null,
          phone: detail.phone ?? null,
          web: detail.web ?? null,
          address: detail.address ?? null,
          city: detail.city ?? null,
          zip: detail.zip ?? null,
          nace: '6920',
          source: 'firmy.cz',
          status: 'new',
        })
      } catch (err) {
        console.error(`[Firmy.cz] Detail failed for ${listing.name}:`, err)
      }
    }

    if (leads.length > 0) yield leads

    // Stop if no pagination marker
    if (!listingHtml.includes('rel="next"') && !listingHtml.includes('"next"')) break
  }
}
