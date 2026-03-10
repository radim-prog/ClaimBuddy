import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAllCompanies } from '@/lib/company-store'
import {
  type HealthScoreBreakdown,
  type CompanyHealthScore,
  HEALTH_SCORE_WEIGHTS,
  MIN_MONTHS_FOR_SCORE,
  getHealthGrade,
} from '@/lib/types/health-score'

// Generate last N COMPLETED periods as YYYY-MM strings (excludes current month)
function getLastNPeriods(n: number): string[] {
  const periods: string[] = []
  const now = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return periods
}

// Calculate months since a date
function monthsSince(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
}

// ============================================
// DIMENSION CALCULATORS
// ============================================

function calcDocumentsScore(
  closures: Array<{ period: string; bank: string; expense: string; income: string; reminder_count: number }>,
  periods: string[]
): { score: number; monthsWithData: number } {
  const relevantClosures = closures.filter(c => periods.includes(c.period))
  if (relevantClosures.length === 0) return { score: 0, monthsWithData: 0 }

  let totalScore = 0
  for (const c of relevantClosures) {
    const allPresent = c.bank !== 'missing' && c.expense !== 'missing' && c.income !== 'missing'
    let monthScore = allPresent ? 100 : 0

    // Partial credit: each non-missing doc = 33 points
    if (!allPresent) {
      let count = 0
      if (c.bank !== 'missing') count++
      if (c.expense !== 'missing') count++
      if (c.income !== 'missing') count++
      monthScore = Math.round((count / 3) * 100)
    }

    // Penalize high reminder count (max -30 points)
    const reminderPenalty = Math.min(c.reminder_count * 10, 30)
    monthScore = Math.max(0, monthScore - reminderPenalty)

    totalScore += monthScore
  }

  return {
    score: Math.round(totalScore / relevantClosures.length),
    monthsWithData: relevantClosures.length,
  }
}

function calcPaymentsScore(
  payments: Array<{ period: string; paid: boolean }>,
  periods: string[]
): { score: number; monthsWithData: number } {
  // Only score months that have a payment RECORD (explicit data).
  // Missing records = accountant hasn't entered it yet → don't penalize.
  const relevant = payments.filter(p => periods.includes(p.period))
  if (relevant.length === 0) return { score: 0, monthsWithData: 0 }

  const paidCount = relevant.filter(p => p.paid).length
  return {
    score: Math.round((paidCount / relevant.length) * 100),
    monthsWithData: relevant.length,
  }
}

function calcCommunicationScore(
  messages: Array<{ sender_type: string; created_at: string; chat_id: string }>
): number {
  // Group messages by chat, find pairs: accountant message → next client response
  const byChat = new Map<string, Array<{ sender_type: string; created_at: string }>>()
  for (const m of messages) {
    if (!byChat.has(m.chat_id)) byChat.set(m.chat_id, [])
    byChat.get(m.chat_id)!.push({ sender_type: m.sender_type, created_at: m.created_at })
  }

  const responseTimes: number[] = []
  for (const chatMsgs of byChat.values()) {
    // Sort by time
    chatMsgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    for (let i = 0; i < chatMsgs.length - 1; i++) {
      if (chatMsgs[i].sender_type === 'accountant' && chatMsgs[i + 1].sender_type === 'client') {
        const diffHours = (new Date(chatMsgs[i + 1].created_at).getTime() - new Date(chatMsgs[i].created_at).getTime()) / (1000 * 60 * 60)
        responseTimes.push(diffHours)
      }
    }
  }

  if (responseTimes.length === 0) return 50 // neutral if no data

  // Median response time
  responseTimes.sort((a, b) => a - b)
  const median = responseTimes[Math.floor(responseTimes.length / 2)]

  // Score: <4h = 100, 4-12h = 80, 12-24h = 60, 24-48h = 40, 48-72h = 20, >72h = 0
  if (median <= 4) return 100
  if (median <= 12) return 80
  if (median <= 24) return 60
  if (median <= 48) return 40
  if (median <= 72) return 20
  return 0
}

function calcCooperationScore(
  tasks: Array<{ status: string; waiting_for: string | null; created_at: string; completed_at: string | null }>
): number {
  const now = new Date()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  // Tasks where waiting_for = 'client'
  // Exclude tasks created less than 7 days ago that aren't completed yet
  // (they still have time — don't penalize prematurely)
  const clientTasks = tasks.filter(t => {
    if (t.waiting_for !== 'client') return false
    if (t.status === 'completed') return true // always count completed
    // Open task: only count if older than 7 days (past deadline)
    const age = now.getTime() - new Date(t.created_at).getTime()
    return age > sevenDaysMs
  })

  if (clientTasks.length === 0) return 75 // neutral if no scoreable client tasks

  let resolvedInTime = 0
  for (const t of clientTasks) {
    if (t.status === 'completed' && t.completed_at) {
      const daysTaken = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysTaken <= 7) resolvedInTime++
    }
  }

  return Math.round((resolvedInTime / clientTasks.length) * 100)
}

function calcStabilityScore(
  clientSince: string | null,
  events: Array<{ event_type: string }>
): number {
  if (!clientSince) return 50 // unknown

  const months = monthsSince(clientSince)

  // Base: months as client (capped at 36 = 3 years for full score)
  let score = Math.min(Math.round((months / 36) * 100), 100)

  // Penalize negative events
  const negativeEvents = events.filter(e => e.event_type === 'paused' || e.event_type === 'churned')
  score = Math.max(0, score - negativeEvents.length * 25)

  return score
}

// ============================================
// MAIN ENGINE
// ============================================

export async function calculateHealthScore(companyId: string): Promise<CompanyHealthScore> {
  const periods = getLastNPeriods(6)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sinceDate = sixMonthsAgo.toISOString()

  // First: get chat ID for this company (needed for messages query)
  const chatRes = await supabaseAdmin
    .from('chats')
    .select('id')
    .eq('company_id', companyId)
    .eq('type', 'company_chat')
    .limit(1)
    .single()
  const chatId = chatRes.data?.id ?? null

  // Parallel fetch all data
  const [closuresRes, paymentsRes, messagesRes, tasksRes, eventsRes, companyRes] = await Promise.all([
    supabaseAdmin
      .from('monthly_closures')
      .select('period, bank_statement_status, expense_invoices_status, income_invoices_status, reminder_count')
      .eq('company_id', companyId)
      .in('period', periods),
    supabaseAdmin
      .from('monthly_payments')
      .select('period, paid')
      .eq('company_id', companyId)
      .in('period', periods),
    chatId
      ? supabaseAdmin
          .from('chat_messages')
          .select('sender_type, created_at, chat_id')
          .eq('chat_id', chatId)
          .gte('created_at', sinceDate)
          .order('created_at')
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('tasks')
      .select('status, waiting_for, created_at, completed_at')
      .eq('company_id', companyId)
      .gte('created_at', sinceDate),
    supabaseAdmin
      .from('client_events')
      .select('event_type')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('companies')
      .select('billing_settings, status')
      .eq('id', companyId)
      .single(),
  ])

  const closures = (closuresRes.data ?? []).map(c => ({
    period: c.period,
    bank: c.bank_statement_status || 'missing',
    expense: c.expense_invoices_status || 'missing',
    income: c.income_invoices_status || 'missing',
    reminder_count: c.reminder_count || 0,
  }))

  const payments = (paymentsRes.data ?? []).map(p => ({
    period: p.period,
    paid: p.paid === true,
  }))

  const messages = (messagesRes.data ?? []).map(m => ({
    sender_type: m.sender_type,
    created_at: m.created_at,
    chat_id: m.chat_id,
  }))

  const tasks = (tasksRes.data ?? []).map(t => ({
    status: t.status,
    waiting_for: t.waiting_for,
    created_at: t.created_at,
    completed_at: t.completed_at,
  }))

  const events = (eventsRes.data ?? []).map(e => ({ event_type: e.event_type }))
  const clientSince = companyRes.data?.billing_settings?.client_since ?? null

  // Calculate dimensions
  const docsResult = calcDocumentsScore(closures, periods)
  const paymentsResult = calcPaymentsScore(payments, periods)
  const communicationScore = calcCommunicationScore(messages)
  const cooperationScore = calcCooperationScore(tasks)
  const stabilityScore = calcStabilityScore(clientSince, events)

  // Determine months of available data
  const monthsOfData = Math.max(docsResult.monthsWithData, paymentsResult.monthsWithData)

  if (monthsOfData < MIN_MONTHS_FOR_SCORE) {
    return {
      company_id: companyId,
      score: null,
      grade: null,
      breakdown: null,
      updated_at: new Date().toISOString(),
      months_of_data: monthsOfData,
    }
  }

  const breakdown: HealthScoreBreakdown = {
    documents: docsResult.score,
    payments: paymentsResult.score,
    communication: communicationScore,
    cooperation: cooperationScore,
    stability: stabilityScore,
  }

  const score = Math.round(
    breakdown.documents * HEALTH_SCORE_WEIGHTS.documents +
    breakdown.payments * HEALTH_SCORE_WEIGHTS.payments +
    breakdown.communication * HEALTH_SCORE_WEIGHTS.communication +
    breakdown.cooperation * HEALTH_SCORE_WEIGHTS.cooperation +
    breakdown.stability * HEALTH_SCORE_WEIGHTS.stability
  )

  return {
    company_id: companyId,
    score,
    grade: getHealthGrade(score),
    breakdown,
    updated_at: new Date().toISOString(),
    months_of_data: monthsOfData,
  }
}

// Calculate and cache health scores for all active companies
export async function calculateAllHealthScores(): Promise<{
  updated: number
  skipped: number
  errors: number
}> {
  const companies = await getAllCompanies()
  const activeCompanies = companies.filter(c => c.status === 'active')

  let updated = 0
  let skipped = 0
  let errors = 0

  // Process in batches of 10 to avoid overwhelming the DB
  const batchSize = 10
  for (let i = 0; i < activeCompanies.length; i += batchSize) {
    const batch = activeCompanies.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(company => calculateHealthScore(company.id))
    )

    for (const result of results) {
      if (result.status === 'rejected') {
        errors++
        console.error('Health score calculation error:', result.reason)
        continue
      }

      const hs = result.value
      if (hs.score === null) {
        skipped++
        // Clear cached score for insufficient data
        await supabaseAdmin
          .from('companies')
          .update({
            health_score: null,
            health_score_breakdown: null,
            health_score_updated_at: new Date().toISOString(),
          })
          .eq('id', hs.company_id)
        continue
      }

      const { error } = await supabaseAdmin
        .from('companies')
        .update({
          health_score: hs.score,
          health_score_breakdown: hs.breakdown,
          health_score_updated_at: hs.updated_at,
        })
        .eq('id', hs.company_id)

      if (error) {
        errors++
        console.error(`Failed to save health score for ${hs.company_id}:`, error.message)
      } else {
        updated++
      }
    }
  }

  return { updated, skipped, errors }
}
