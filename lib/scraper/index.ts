// Main scraper orchestrator
// Runs ARES + Firmy.cz scrapers, deduplicates, and stores to scraped_leads table

import { fetchAresAccountants } from './ares-scraper'
import { fetchFirmyAccountants } from './firmy-scraper'
import { upsertScrapedLeads } from './leads-store'
import { ACCOUNTANT_NACE_CODES } from './types'
import type { ScraperResult } from './types'

export type ScraperOptions = {
  sources?: Array<'ares' | 'firmy.cz'>
  maxPagesAres?: number
  maxPagesFirmy?: number
  onProgress?: (msg: string) => void
}

export async function runAccountantScraper(
  opts: ScraperOptions = {}
): Promise<ScraperResult> {
  const {
    sources = ['ares', 'firmy.cz'],
    maxPagesAres = 50,
    maxPagesFirmy = 20,
    onProgress = console.log,
  } = opts

  const aggregate: ScraperResult = {
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: 0,
    leads: [],
  }

  // ── ARES ────────────────────────────────────────────────────────────────
  if (sources.includes('ares')) {
    onProgress('[Scraper] Starting ARES scrape (NACE 6920)...')
    try {
      let aresPage = 0
      for await (const batch of fetchAresAccountants(ACCOUNTANT_NACE_CODES, maxPagesAres)) {
        aresPage++
        aggregate.fetched += batch.length
        onProgress(`[ARES] Page ${aresPage}: fetched ${batch.length} firms`)

        const stored = await upsertScrapedLeads(batch)
        aggregate.inserted += stored.inserted
        aggregate.skipped += stored.skipped
        aggregate.errors += stored.errors

        onProgress(
          `[ARES] Page ${aresPage}: +${stored.inserted} new, ${stored.skipped} skip, ${stored.errors} err`
        )
      }
    } catch (err) {
      console.error('[Scraper] ARES fatal error:', err)
    }
  }

  // ── Firmy.cz ────────────────────────────────────────────────────────────
  if (sources.includes('firmy.cz')) {
    onProgress('[Scraper] Starting Firmy.cz scrape...')
    try {
      let firmyPage = 0
      for await (const batch of fetchFirmyAccountants(maxPagesFirmy)) {
        firmyPage++
        aggregate.fetched += batch.length
        onProgress(`[Firmy.cz] Page ${firmyPage}: fetched ${batch.length} firms`)

        const stored = await upsertScrapedLeads(batch)
        aggregate.inserted += stored.inserted
        aggregate.skipped += stored.skipped
        aggregate.errors += stored.errors

        onProgress(
          `[Firmy.cz] Page ${firmyPage}: +${stored.inserted} new, ${stored.skipped} skip, ${stored.errors} err`
        )
      }
    } catch (err) {
      console.error('[Scraper] Firmy.cz fatal error:', err)
    }
  }

  onProgress(
    `[Scraper] Done — fetched: ${aggregate.fetched}, inserted: ${aggregate.inserted}, skipped: ${aggregate.skipped}, errors: ${aggregate.errors}`
  )

  return aggregate
}

export { getScrapedLeadsStats } from './leads-store'
