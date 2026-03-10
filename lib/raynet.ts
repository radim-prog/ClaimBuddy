// Raynet CRM API client
// Auth: Basic auth (email:apikey), header X-Instance-Name
// Docs: https://s3-eu-west-1.amazonaws.com/static-raynet/webroot/api-doc.html

import type { RaynetCompany, RaynetBC, CreateBCPayload } from '@/lib/types/raynet'

// Constants
export const ACCOUNTING_BC_TYPE_ID = 226  // "Veronika Účto"
export const PHASE_VYHRA = 5              // Paid (E_WIN)
export const PHASE_FAKTURACE = 125        // Invoiced, unpaid (B_ACTIVE)
export const CATEGORY_KLIENT = 157

const BASE_URL = 'https://app.raynet.cz/api/v2'

function getHeaders(): HeadersInit {
  const email = process.env.RAYNET_EMAIL
  const apiKey = process.env.RAYNET_API_KEY
  const instance = process.env.RAYNET_INSTANCE_NAME

  if (!email || !apiKey || !instance) {
    throw new Error('Missing Raynet credentials: RAYNET_EMAIL, RAYNET_API_KEY, RAYNET_INSTANCE_NAME')
  }

  const basicAuth = Buffer.from(`${email}:${apiKey}`).toString('base64')

  return {
    'Authorization': `Basic ${basicAuth}`,
    'X-Instance-Name': instance,
    'Content-Type': 'application/json',
  }
}

async function raynetFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Raynet API error ${res.status}: ${text}`)
  }

  return res
}

// --- Read: Companies ---

export async function getRaynetCompanies(opts?: {
  category?: number
  search?: string
  offset?: number
  limit?: number
}): Promise<{ data: RaynetCompany[]; totalCount: number }> {
  const params = new URLSearchParams()

  if (opts?.category) {
    params.set('category[EQ]', String(opts.category))
  }
  if (opts?.search) {
    params.set('fulltext', opts.search)
  }
  params.set('offset', String(opts?.offset || 0))
  params.set('limit', String(opts?.limit || 100))

  const res = await raynetFetch(`/company/?${params.toString()}`)
  const json = await res.json()

  const companies: RaynetCompany[] = (json.data || []).map((c: Record<string, unknown>) => ({
    id: c.id as number,
    name: (c.name as string) || '',
    regNumber: (c.regNumber as string) || null,
    person: (c.person as boolean) || false,
    state: (c.state as string) || '',
    category: c.category
      ? { id: (c.category as Record<string, unknown>).id as number, value: (c.category as Record<string, unknown>).value as string }
      : null,
  }))

  return { data: companies, totalCount: json.totalCount || companies.length }
}

// --- Read: Business Cases (accounting type) ---

export async function getAccountingBusinessCases(year?: number): Promise<RaynetBC[]> {
  const allBCs: RaynetBC[] = []
  let offset = 0
  const limit = 100

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams()
    params.set('businessCaseType', String(ACCOUNTING_BC_TYPE_ID))
    params.set('offset', String(offset))
    params.set('limit', String(limit))

    if (year) {
      params.set('validFrom[GE]', `${year}-01-01`)
      params.set('validFrom[LE]', `${year}-12-31`)
    }

    const res = await raynetFetch(`/businessCase/?${params.toString()}`)
    const json = await res.json()
    const data = json.data || []

    for (const bc of data) {
      allBCs.push(mapBC(bc))
    }

    if (data.length < limit) break
    offset += limit
  }

  return allBCs
}

// --- Write: Update BC phase ---

export async function updateBusinessCasePhase(bcId: number, phaseId: number): Promise<void> {
  // Raynet uses PUT /businessCase/{id}/ with phase in body
  await raynetFetch(`/businessCase/${bcId}/`, {
    method: 'PUT',
    body: JSON.stringify({
      businessCasePhase: phaseId,
    }),
  })
}

// --- Write: Create BC ---

export async function createBusinessCase(data: CreateBCPayload): Promise<{ id: number }> {
  const res = await raynetFetch('/businessCase/', {
    method: 'PUT',
    body: JSON.stringify({
      name: data.name,
      company: data.companyId,
      businessCaseType: ACCOUNTING_BC_TYPE_ID,
      businessCasePhase: PHASE_FAKTURACE,
      totalAmount: data.totalAmount || 0,
      validFrom: data.validFrom,
    }),
  })

  const json = await res.json()
  return { id: json.data?.id || json.id }
}

// --- Helper: map raw API response to RaynetBC ---

function mapBC(bc: Record<string, unknown>): RaynetBC {
  const company = bc.company as Record<string, unknown> | null
  const phase = bc.businessCasePhase as Record<string, unknown> | null
  const bcType = bc.businessCaseType as Record<string, unknown> | null

  return {
    id: bc.id as number,
    name: (bc.name as string) || '',
    company: company
      ? { id: company.id as number, name: (company.name as string) || '' }
      : { id: 0, name: '' },
    totalAmount: (bc.totalAmount as number) || 0,
    validFrom: (bc.validFrom as string) || '',
    validTill: (bc.validTill as string) || null,
    status: (bc.status as string) || '',
    businessCasePhase: phase
      ? { id: phase.id as number, value: (phase.value as string) || '' }
      : { id: 0, value: '' },
    businessCaseType: bcType
      ? { id: bcType.id as number, value: (bcType.value as string) || '' }
      : { id: 0, value: '' },
  }
}

// --- Helper: Parse BC name to extract period ---

export function parseBCName(name: string, validFrom: string): { period: string; isExtra: boolean } {
  // Standard: "účto MM YYYY" or "účto MM YY" (with possible extra spaces)
  const match = name.match(/^účto\s+(\d{1,2})\s+(\d{2,4})$/i)
  if (match) {
    const month = match[1].padStart(2, '0')
    let year = match[2]
    if (year.length === 2) {
      year = `20${year}`
    }
    return { period: `${year}-${month}`, isExtra: false }
  }

  // "účto" without period → derive from validFrom
  if (/^účto$/i.test(name.trim())) {
    const period = validFrom.substring(0, 7) // YYYY-MM
    return { period, isExtra: false }
  }

  // "Pravidelné účetnictví" → regular
  if (/pravidelné?\s+účetnictví/i.test(name)) {
    const period = validFrom.substring(0, 7)
    return { period, isExtra: false }
  }

  // Everything else is extra service (Sloučení, DP, Zřízení, Rekonstrukce...)
  const period = validFrom.substring(0, 7)
  return { period, isExtra: true }
}
