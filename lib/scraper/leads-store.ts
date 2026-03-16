// Storage layer for scraped accountant leads
// DB table: scraped_leads (see migration SQL below)
//
// Migration (run in Supabase SQL editor):
// CREATE TABLE IF NOT EXISTS scraped_leads (
//   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   ico        TEXT,
//   name       TEXT NOT NULL,
//   email      TEXT,
//   phone      TEXT,
//   web        TEXT,
//   address    TEXT,
//   city       TEXT,
//   zip        TEXT,
//   nace       TEXT,
//   source     TEXT NOT NULL,
//   status     TEXT NOT NULL DEFAULT 'new',
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE UNIQUE INDEX IF NOT EXISTS scraped_leads_ico_unique ON scraped_leads (ico) WHERE ico IS NOT NULL AND ico != '';
// CREATE INDEX IF NOT EXISTS scraped_leads_source ON scraped_leads (source);
// CREATE INDEX IF NOT EXISTS scraped_leads_status ON scraped_leads (status);

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ScrapedLead } from './types'

export type UpsertResult = {
  inserted: number
  skipped: number
  errors: number
}

// Upsert a batch of leads (skip duplicates by ICO)
export async function upsertScrapedLeads(leads: ScrapedLead[]): Promise<UpsertResult> {
  const result: UpsertResult = { inserted: 0, skipped: 0, errors: 0 }
  if (leads.length === 0) return result

  // Filter out leads with empty names
  const valid = leads.filter((l) => l.name.trim().length > 0)

  // Batch upsert — conflict on ico (ignored if null/empty)
  const rows = valid.map((l) => ({
    ico: l.ico && l.ico.trim() ? l.ico.trim() : null,
    name: l.name.trim(),
    email: l.email?.trim() || null,
    phone: l.phone?.trim() || null,
    web: l.web?.trim() || null,
    address: l.address?.trim() || null,
    city: l.city?.trim() || null,
    zip: l.zip?.trim() || null,
    nace: l.nace || null,
    source: l.source,
    status: l.status,
  }))

  // Split into ICO-bearing and anonymous (can't upsert without unique key)
  const withIco = rows.filter((r) => r.ico)
  const withoutIco = rows.filter((r) => !r.ico)

  // Upsert rows with ICO (deduplicate by ICO)
  if (withIco.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('scraped_leads')
      .upsert(withIco, {
        onConflict: 'ico',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      console.error('[ScraperStore] Upsert error:', error.message)
      result.errors += withIco.length
    } else {
      const inserted = (data ?? []).length
      result.inserted += inserted
      result.skipped += withIco.length - inserted
    }
  }

  // Insert rows without ICO (no dedup possible — skip if name collision)
  for (const row of withoutIco) {
    const { error } = await supabaseAdmin
      .from('scraped_leads')
      .insert(row)

    if (error) {
      if (error.code === '23505') {
        result.skipped++
      } else {
        console.error('[ScraperStore] Insert error:', error.message)
        result.errors++
      }
    } else {
      result.inserted++
    }
  }

  return result
}

// Get count of scraped leads per source
export async function getScrapedLeadsStats() {
  const { data, error } = await supabaseAdmin
    .from('scraped_leads')
    .select('source, status')

  if (error || !data) return {}

  const stats: Record<string, Record<string, number>> = {}
  for (const row of data) {
    if (!stats[row.source]) stats[row.source] = {}
    const s = stats[row.source]
    s[row.status] = (s[row.status] ?? 0) + 1
  }
  return stats
}
