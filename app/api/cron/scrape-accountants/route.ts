export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min — scraping takes time

// Cron endpoint — scrape Czech accounting firms from ARES + Firmy.cz
// Stores results in `scraped_leads` table (NACE 6920)
//
// DB migration (run once in Supabase SQL editor):
//   CREATE TABLE IF NOT EXISTS scraped_leads (
//     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     ico        TEXT,
//     name       TEXT NOT NULL,
//     email      TEXT,
//     phone      TEXT,
//     web        TEXT,
//     address    TEXT,
//     city       TEXT,
//     zip        TEXT,
//     nace       TEXT,
//     source     TEXT NOT NULL,
//     status     TEXT NOT NULL DEFAULT 'new',
//     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );
//   CREATE UNIQUE INDEX IF NOT EXISTS scraped_leads_ico_unique
//     ON scraped_leads (ico) WHERE ico IS NOT NULL AND ico != '';
//   CREATE INDEX IF NOT EXISTS scraped_leads_source ON scraped_leads (source);
//   CREATE INDEX IF NOT EXISTS scraped_leads_status ON scraped_leads (status);

import { NextRequest, NextResponse } from 'next/server'
import { runAccountantScraper, getScrapedLeadsStats } from '@/lib/scraper'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function POST(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  // Parse options from body (optional)
  let sources: Array<'ares' | 'firmy.cz'> = ['ares', 'firmy.cz']
  let maxPagesAres = 50
  let maxPagesFirmy = 20

  try {
    const body = await request.json().catch(() => ({}))
    if (body.sources) sources = body.sources
    if (body.maxPagesAres) maxPagesAres = Number(body.maxPagesAres)
    if (body.maxPagesFirmy) maxPagesFirmy = Number(body.maxPagesFirmy)
  } catch {
    // use defaults
  }

  const logs: string[] = []
  const startedAt = Date.now()

  try {
    const result = await runAccountantScraper({
      sources,
      maxPagesAres,
      maxPagesFirmy,
      onProgress: (msg) => {
        console.log(msg)
        logs.push(msg)
      },
    })

    const stats = await getScrapedLeadsStats()
    const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1)

    return NextResponse.json({
      success: true,
      durationSec,
      result: {
        fetched: result.fetched,
        inserted: result.inserted,
        skipped: result.skipped,
        errors: result.errors,
      },
      dbStats: stats,
      logs,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron/scrape-accountants] Fatal:', msg)
    return NextResponse.json(
      { success: false, error: msg, logs },
      { status: 500 }
    )
  }
}

// GET — return current stats without running the scraper
export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const stats = await getScrapedLeadsStats()
  return NextResponse.json({ stats })
}
