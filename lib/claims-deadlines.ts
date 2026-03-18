import { supabaseAdmin } from '@/lib/supabase-admin'

export interface ClaimsDeadline {
  id: string
  case_id: string
  case_number: string
  company_id: string | null
  company_name: string | null
  title: string
  deadline: string // ISO date
  type: 'insurance_response' | 'appeal' | 'custom'
  status: string
  days_remaining: number
  is_overdue: boolean
}

/**
 * Generate deadlines from insurance_cases based on status:
 * - submitted → 90-day insurance company response deadline
 * - rejected → 30-day appeal deadline
 * - any case with deadline field → custom deadline
 */
export async function getClaimsDeadlines(): Promise<ClaimsDeadline[]> {
  const { data: cases, error } = await supabaseAdmin
    .from('insurance_cases')
    .select('id, case_number, status, deadline, created_at, updated_at, company_id, company:companies!insurance_cases_company_id_fkey(id, name)')
    .in('status', ['submitted', 'rejected', 'new', 'gathering_docs', 'under_review', 'additional_info', 'appealed'])

  if (error || !cases) return []

  const now = new Date()
  const deadlines: ClaimsDeadline[] = []

  for (const c of cases) {
    const companyRaw = c.company as unknown as { id: string; name: string } | null
    const company = Array.isArray(companyRaw) ? companyRaw[0] ?? null : companyRaw

    // submitted → 90-day insurance response
    if (c.status === 'submitted' && c.created_at) {
      const dl = new Date(c.created_at)
      dl.setDate(dl.getDate() + 90)
      const daysRemaining = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      deadlines.push({
        id: `${c.id}-insurance-response`,
        case_id: c.id,
        case_number: c.case_number,
        company_id: c.company_id,
        company_name: company?.name ?? null,
        title: `Lhůta pojišťovny 3 měsíce — ${c.case_number}`,
        deadline: dl.toISOString(),
        type: 'insurance_response',
        status: c.status,
        days_remaining: daysRemaining,
        is_overdue: daysRemaining < 0,
      })
    }

    // rejected → 30-day appeal
    if (c.status === 'rejected' && c.updated_at) {
      const dl = new Date(c.updated_at)
      dl.setDate(dl.getDate() + 30)
      const daysRemaining = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      deadlines.push({
        id: `${c.id}-appeal`,
        case_id: c.id,
        case_number: c.case_number,
        company_id: c.company_id,
        company_name: company?.name ?? null,
        title: `Odvolací lhůta 30 dní — ${c.case_number}`,
        deadline: dl.toISOString(),
        type: 'appeal',
        status: c.status,
        days_remaining: daysRemaining,
        is_overdue: daysRemaining < 0,
      })
    }

    // custom deadline from the deadline field
    if (c.deadline) {
      const dl = new Date(c.deadline)
      const daysRemaining = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      deadlines.push({
        id: `${c.id}-custom`,
        case_id: c.id,
        case_number: c.case_number,
        company_id: c.company_id,
        company_name: company?.name ?? null,
        title: `Termín — ${c.case_number}`,
        deadline: dl.toISOString(),
        type: 'custom',
        status: c.status,
        days_remaining: daysRemaining,
        is_overdue: daysRemaining < 0,
      })
    }
  }

  // Sort by deadline ascending (most urgent first)
  deadlines.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  return deadlines
}
