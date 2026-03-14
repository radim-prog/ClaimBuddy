import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCompanyBasics } from '@/lib/company-store'
import { getClosures } from '@/lib/closure-store-db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const [allCompanies, allClosures, chatsResult, notificationsResult, tasksResult] = await Promise.all([
      getCompanyBasics(),
      getClosures({ period: currentPeriod }),
      supabaseAdmin.from('chats').select('id, company_id').eq('type', 'company_chat'),
      supabaseAdmin.from('client_notifications').select('company_id').eq('status', 'active'),
      supabaseAdmin.from('tasks').select('company_id').in('status', ['pending', 'in_progress', 'accepted']).not('company_id', 'is', null),
    ])

    // Build company name map (only active companies)
    const companyMap = new Map<string, string>()
    for (const c of allCompanies) {
      if (c.status !== 'inactive') {
        companyMap.set(c.id, c.name)
      }
    }

    // 1. Unread messages: get chat→company mapping, then fetch unread messages
    const chatCompanyMap = new Map<string, string>()
    const chatIds: string[] = []
    for (const chat of chatsResult.data || []) {
      if (chat.company_id && companyMap.has(chat.company_id)) {
        chatCompanyMap.set(chat.id, chat.company_id)
        chatIds.push(chat.id)
      }
    }

    let unreadByCompany = new Map<string, number>()
    if (chatIds.length > 0) {
      const { data: unreadMessages } = await supabaseAdmin
        .from('chat_messages')
        .select('chat_id')
        .in('chat_id', chatIds)
        .eq('sender_type', 'client')
        .eq('read', false)

      for (const msg of unreadMessages || []) {
        const companyId = chatCompanyMap.get(msg.chat_id)
        if (companyId) {
          unreadByCompany.set(companyId, (unreadByCompany.get(companyId) || 0) + 1)
        }
      }
    }

    // 2. Active notifications per company
    const notifByCompany = new Map<string, number>()
    for (const n of notificationsResult.data || []) {
      if (companyMap.has(n.company_id)) {
        notifByCompany.set(n.company_id, (notifByCompany.get(n.company_id) || 0) + 1)
      }
    }

    // 3. Missing/uploaded documents from current month closures (already filtered by period)
    const missingByCompany = new Map<string, number>()
    const uploadedByCompany = new Map<string, number>()
    for (const closure of allClosures) {
      if (!companyMap.has(closure.company_id)) continue

      let missing = 0
      let uploaded = 0
      if (closure.bank_statement_status === 'missing') missing++
      if (closure.expense_documents_status === 'missing') missing++
      if (closure.income_invoices_status === 'missing') missing++
      if (closure.bank_statement_status === 'uploaded') uploaded++
      if (closure.expense_documents_status === 'uploaded') uploaded++
      if (closure.income_invoices_status === 'uploaded') uploaded++

      if (missing > 0) missingByCompany.set(closure.company_id, missing)
      if (uploaded > 0) uploadedByCompany.set(closure.company_id, uploaded)
    }

    // 4. Active tasks per company
    const tasksByCompany = new Map<string, number>()
    for (const t of tasksResult.data || []) {
      if (t.company_id && companyMap.has(t.company_id)) {
        tasksByCompany.set(t.company_id, (tasksByCompany.get(t.company_id) || 0) + 1)
      }
    }

    // Assemble per-company data
    const companies: Array<{
      company_id: string
      company_name: string
      unread_messages: number
      active_notifications: number
      missing_documents: number
      pending_uploads: number
      active_tasks: number
      total: number
    }> = []

    const totals = {
      unread_messages: 0,
      active_notifications: 0,
      missing_documents: 0,
      pending_uploads: 0,
      active_tasks: 0,
      total: 0,
      companies_needing_attention: 0,
    }

    for (const [companyId, companyName] of companyMap) {
      const unread = unreadByCompany.get(companyId) || 0
      const notif = notifByCompany.get(companyId) || 0
      const missing = missingByCompany.get(companyId) || 0
      const uploaded = uploadedByCompany.get(companyId) || 0
      const tasks = tasksByCompany.get(companyId) || 0
      const total = unread + notif + missing + uploaded + tasks

      if (total > 0) {
        companies.push({
          company_id: companyId,
          company_name: companyName,
          unread_messages: unread,
          active_notifications: notif,
          missing_documents: missing,
          pending_uploads: uploaded,
          active_tasks: tasks,
          total,
        })

        totals.unread_messages += unread
        totals.active_notifications += notif
        totals.missing_documents += missing
        totals.pending_uploads += uploaded
        totals.active_tasks += tasks
        totals.total += total
        totals.companies_needing_attention++
      }
    }

    // Sort by total descending
    companies.sort((a, b) => b.total - a.total)

    return NextResponse.json({ companies, totals })
  } catch (error) {
    console.error('Attention API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
