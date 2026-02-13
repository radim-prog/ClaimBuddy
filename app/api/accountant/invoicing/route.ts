import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Helper to get invoice status from invoice record
function getInvoiceStatus(invoice: any): 'draft' | 'sent' | 'paid' {
  if (invoice.paid_at) return 'paid'
  if (invoice.sent_at) return 'sent'
  return 'draft'
}

// Transform time_logs to time entries format
function transformTimeEntries(timeLogs: any[]): any[] {
  return timeLogs.map(log => ({
    date: log.date || log.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    userId: log.user_id || 'unknown',
    userName: log.user_name || log.user?.name || 'Unknown User',
    description: log.description || log.task_title || 'Work entry',
    hours: log.hours || (log.minutes ? log.minutes / 60 : 0),
    note: log.note || '',
    billable: log.billable !== false,
  }))
}

// Build invoicing periods from time_logs and invoices data
function buildInvoicingPeriods(timeLogs: any[], invoices: any[]): { period: string; projects: any[] }[] {
  const periodMap = new Map<string, Map<string, any>>()

  // Group time logs by period and company
  for (const log of timeLogs) {
    const date = log.date || log.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
    const period = date.substring(0, 7) // YYYY-MM
    
    const companyId = log.company_id || 'unknown'
    const companyName = log.company?.name || log.company_name || 'Unknown Company'
    
    if (!periodMap.has(period)) {
      periodMap.set(period, new Map())
    }
    
    const companiesInPeriod = periodMap.get(period)!
    
    if (!companiesInPeriod.has(companyId)) {
      companiesInPeriod.set(companyId, {
        id: `project-${period}-${companyId}`,
        clientId: companyId,
        clientName: companyName,
        projectTitle: `${companyName} - účetní služby ${period}`,
        totalBillableHours: 0,
        hourlyRate: log.hourly_rate || 1000,
        totalAmount: 0,
        invoiceStatus: 'draft' as const,
        timeEntries: [],
      })
    }
    
    const project = companiesInPeriod.get(companyId)!
    const hours = log.hours || (log.minutes ? log.minutes / 60 : 0)
    
    project.totalBillableHours += hours
    project.timeEntries.push({
      date,
      userId: log.user_id || 'unknown',
      userName: log.user_name || log.user?.name || 'Unknown User',
      description: log.description || log.task_title || 'Work entry',
      hours,
      note: log.note || '',
      billable: log.billable !== false,
    })
  }

  // Update status from invoices
  for (const invoice of invoices || []) {
    const period = invoice.period || invoice.issue_date?.substring(0, 7)
    const companyId = invoice.company_id
    
    if (period && companyId && periodMap.has(period)) {
      const companiesInPeriod = periodMap.get(period)!
      if (companiesInPeriod.has(companyId)) {
        const project = companiesInPeriod.get(companyId)!
        project.invoiceStatus = getInvoiceStatus(invoice)
        project.hourlyRate = invoice.hourly_rate || project.hourlyRate
      }
    }
  }

  // Calculate totals and convert to array
  const periods: { period: string; projects: any[] }[] = []
  
  for (const [period, companiesMap] of periodMap) {
    const projects: any[] = []
    
    for (const [, project] of companiesMap) {
      project.totalAmount = Math.round(project.totalBillableHours * project.hourlyRate)
      projects.push(project)
    }
    
    // Sort by total amount desc
    projects.sort((a, b) => b.totalAmount - a.totalAmount)
    
    periods.push({ period, projects })
  }
  
  // Sort periods desc (newest first)
  periods.sort((a, b) => b.period.localeCompare(a.period))
  
  return periods
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get period from query params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const companyId = searchParams.get('company_id')

    // Fetch time logs with company info
    let timeLogsQuery = supabaseAdmin
      .from('time_logs')
      .select(`
        *,
        company:companies(id, name)
      `)
      .order('date', { ascending: false })

    if (period) {
      timeLogsQuery = timeLogsQuery.gte('date', `${period}-01`).lte('date', `${period}-31`)
    }

    if (companyId) {
      timeLogsQuery = timeLogsQuery.eq('company_id', companyId)
    }

    const { data: timeLogs, error: timeLogsError } = await timeLogsQuery.limit(1000)

    if (timeLogsError) {
      console.error('Error fetching time logs:', timeLogsError)
      // Return empty data on error, don't crash
      return NextResponse.json({ periods: [] })
    }

    // Fetch invoices for status mapping
    let invoicesQuery = supabaseAdmin
      .from('invoices')
      .select('*')
      .order('issue_date', { ascending: false })

    if (period) {
      invoicesQuery = invoicesQuery.eq('period', period)
    }

    if (companyId) {
      invoicesQuery = invoicesQuery.eq('company_id', companyId)
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery.limit(500)

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      // Continue without invoices
    }

    // Build invoicing periods
    const periods = buildInvoicingPeriods(timeLogs || [], invoices || [])

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error in invoicing API:', error)
    return NextResponse.json(
      { error: 'Internal server error', periods: [] },
      { status: 500 }
    )
  }
}
