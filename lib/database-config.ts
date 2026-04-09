import { IS_CLAIMS_ONLY_PRODUCT } from '@/lib/product-config'

function pickFirstDefined(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()
}

function isTruthy(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase())
}

function hasDedicatedClaimsEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY &&
    process.env.CLAIMS_SUPABASE_SERVICE_ROLE_KEY
  )
}

function shouldDisallowFallback() {
  return IS_CLAIMS_ONLY_PRODUCT &&
    process.env.NODE_ENV === 'production' &&
    !isTruthy(process.env.ALLOW_ACCOUNTING_DB_FALLBACK)
}

export function getDatabaseConfig() {
  if (shouldDisallowFallback() && !hasDedicatedClaimsEnv()) {
    throw new Error(
      'ClaimBuddy production runtime requires dedicated claims database envs. Set NEXT_PUBLIC_CLAIMS_SUPABASE_URL, NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY and CLAIMS_SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  const url = pickFirstDefined(
    IS_CLAIMS_ONLY_PRODUCT ? process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_URL : undefined,
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )

  const anonKey = pickFirstDefined(
    IS_CLAIMS_ONLY_PRODUCT ? process.env.NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY : undefined,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const serviceRoleKey = pickFirstDefined(
    IS_CLAIMS_ONLY_PRODUCT ? process.env.CLAIMS_SUPABASE_SERVICE_ROLE_KEY : undefined,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  return {
    url,
    anonKey,
    serviceRoleKey,
    usingDedicatedClaimsDatabase: Boolean(IS_CLAIMS_ONLY_PRODUCT && hasDedicatedClaimsEnv()),
  }
}

export function requireDatabaseConfig() {
  const config = getDatabaseConfig()

  if (!config.url) {
    throw new Error(
      'Missing Supabase URL. Set NEXT_PUBLIC_CLAIMS_SUPABASE_URL for ClaimBuddy or NEXT_PUBLIC_SUPABASE_URL as fallback.'
    )
  }

  if (!config.anonKey) {
    throw new Error(
      'Missing Supabase anon key. Set NEXT_PUBLIC_CLAIMS_SUPABASE_ANON_KEY for ClaimBuddy or NEXT_PUBLIC_SUPABASE_ANON_KEY as fallback.'
    )
  }

  if (!config.serviceRoleKey) {
    throw new Error(
      'Missing Supabase service role key. Set CLAIMS_SUPABASE_SERVICE_ROLE_KEY for ClaimBuddy or SUPABASE_SERVICE_ROLE_KEY as fallback.'
    )
  }

  return config
}
