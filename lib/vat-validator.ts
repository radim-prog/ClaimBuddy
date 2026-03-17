// Validace nespolehlivých plátců DPH
// API: MFČR ADIS — Registr plátců DPH
// https://adisreg.mfcr.cz/adistc/DphReg

import { supabaseAdmin } from '@/lib/supabase-admin'

export interface VatPayerCheckResult {
  reliable: boolean
  details: string
  checkedAt: string
  cached: boolean
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// In-memory cache for hot path (per-process)
const memoryCache = new Map<string, { result: VatPayerCheckResult; expiresAt: number }>()

/**
 * Check if a VAT payer (identified by DIČ) is marked as unreliable by MFČR.
 * Uses Supabase cache (24h TTL) with in-memory fallback.
 */
export async function checkUnreliablePayer(dic: string): Promise<VatPayerCheckResult> {
  const normalizedDic = dic.replace(/\s/g, '').toUpperCase()

  // Extract IČ from DIČ (remove CZ prefix)
  const ico = normalizedDic.startsWith('CZ') ? normalizedDic.slice(2) : normalizedDic
  if (!/^\d{8,10}$/.test(ico)) {
    return {
      reliable: false,
      details: `Neplatný formát DIČ: ${dic}`,
      checkedAt: new Date().toISOString(),
      cached: false,
    }
  }

  // 1. Check in-memory cache
  const memEntry = memoryCache.get(ico)
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return { ...memEntry.result, cached: true }
  }

  // 2. Check Supabase cache
  try {
    const { data: cached } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', `vat_check_${ico}`)
      .single()

    if (cached?.setting_value && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < CACHE_TTL_MS) {
        const result = cached.setting_value as unknown as VatPayerCheckResult
        result.cached = true
        memoryCache.set(ico, { result, expiresAt: Date.now() + CACHE_TTL_MS - age })
        return result
      }
    }
  } catch {
    // Cache miss — continue to API
  }

  // 3. Call MFČR ADIS API
  const result = await fetchFromMfcr(ico)

  // 4. Store in cache
  try {
    await supabaseAdmin
      .from('app_settings')
      .upsert({
        setting_key: `vat_check_${ico}`,
        setting_value: result as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
  } catch {
    // Cache write failure is non-critical
  }

  memoryCache.set(ico, { result, expiresAt: Date.now() + CACHE_TTL_MS })
  return result
}

async function fetchFromMfcr(ico: string): Promise<VatPayerCheckResult> {
  const now = new Date().toISOString()

  try {
    // MFČR ADIS — XML endpoint for VAT payer registration check
    const url = `https://adisreg.mfcr.cz/adistc/DphReg?ic=${ico}&typ=DPH`
    const response = await fetch(url, {
      headers: { 'Accept': 'text/xml, application/xml' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return {
        reliable: true, // Default to reliable on API failure (safe fallback)
        details: `MFČR API nedostupné (HTTP ${response.status}). Zkontrolujte ručně.`,
        checkedAt: now,
        cached: false,
      }
    }

    const xml = await response.text()

    // Parse response — look for "nespolehlivy" flag
    const isUnreliable = xml.includes('nespolehlivy') || xml.includes('Nespolehlivý')
    const isRegistered = xml.includes('platce') || xml.includes('Plátce') || xml.includes('<status>')
    const isNotFound = xml.includes('Nenalezen') || xml.includes('nenalezen')

    if (isNotFound) {
      return {
        reliable: false,
        details: `DIČ CZ${ico} nenalezeno v registru plátců DPH.`,
        checkedAt: now,
        cached: false,
      }
    }

    if (isUnreliable) {
      return {
        reliable: false,
        details: `DIČ CZ${ico} je vedeno jako NESPOLEHLIVÝ plátce DPH.`,
        checkedAt: now,
        cached: false,
      }
    }

    if (isRegistered) {
      return {
        reliable: true,
        details: `DIČ CZ${ico} je spolehlivý plátce DPH.`,
        checkedAt: now,
        cached: false,
      }
    }

    return {
      reliable: true,
      details: `Stav DIČ CZ${ico} nelze jednoznačně určit. Zkontrolujte ručně.`,
      checkedAt: now,
      cached: false,
    }
  } catch (err) {
    return {
      reliable: true, // Safe fallback
      details: `Chyba při kontrole: ${err instanceof Error ? err.message : 'neznámá chyba'}. Zkontrolujte ručně.`,
      checkedAt: now,
      cached: false,
    }
  }
}

/**
 * Clear cache for a specific DIČ (e.g. after manual re-check).
 */
export function clearVatCache(dic: string): void {
  const ico = dic.replace(/\s/g, '').toUpperCase().replace(/^CZ/, '')
  memoryCache.delete(ico)
}
