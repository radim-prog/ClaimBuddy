import { supabaseAdmin } from '@/lib/supabase-admin'
import { SUPPLIER, type SupplierInfo } from '@/lib/invoice-config'

let cachedSupplier: SupplierInfo | null = null
let cachedAt = 0
const CACHE_TTL = 60_000 // 1 minute

export async function getSupplierInfo(): Promise<SupplierInfo> {
  if (cachedSupplier && Date.now() - cachedAt < CACHE_TTL) {
    return cachedSupplier
  }

  try {
    const { data } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'supplier_info')
      .single()

    if (data?.setting_value && typeof data.setting_value === 'object') {
      const info = data.setting_value as Record<string, unknown>
      // Validate required fields exist
      if (info.name && info.ico && info.bankAccount) {
        cachedSupplier = data.setting_value as SupplierInfo
        cachedAt = Date.now()
        return cachedSupplier
      }
    }
  } catch {
    // Fallback to hardcoded on any error
  }

  return SUPPLIER
}

export function invalidateSupplierCache() {
  cachedSupplier = null
  cachedAt = 0
}
