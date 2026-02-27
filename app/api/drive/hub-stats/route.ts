import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { HubStats } from '@/lib/types/drive'

export const dynamic = 'force-dynamic'

// GET - Get hub card stats for a company
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    // Calculate date boundaries
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Run all queries in parallel for performance
    const [
      filesTotal,
      filesRecent,
      documentsTotal,
      documentsPending,
      timeLogs,
      openTasks,
      companyInfo,
      activeProjects,
      activeCases,
    ] = await Promise.all([
      // files.total - count all drive_files for this company
      supabaseAdmin
        .from('drive_files')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),

      // files.recent - drive_files created in last 7 days
      supabaseAdmin
        .from('drive_files')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', sevenDaysAgo),

      // documents.total - all documents for this company
      supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),

      // documents.pending - documents with status 'pending' or 'uploaded'
      supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['pending', 'uploaded']),

      // work.hours_this_month - sum hours from time_logs this month
      supabaseAdmin
        .from('time_logs')
        .select('hours')
        .eq('company_id', companyId)
        .gte('date', monthStart),

      // work.open_tasks - count open tasks from gtd_tasks
      supabaseAdmin
        .from('gtd_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['next_action', 'waiting', 'active']),

      // company info
      supabaseAdmin
        .from('companies')
        .select('legal_form, vat_payer')
        .eq('id', companyId)
        .single(),

      // projects.active
      supabaseAdmin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),

      // projects.cases - active cases
      supabaseAdmin
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['open', 'in_progress']),
    ])

    // Sum hours from time_logs
    const hoursThisMonth = (timeLogs.data || []).reduce(
      (sum, log) => sum + (Number(log.hours) || 0),
      0
    )

    const stats: HubStats = {
      files: {
        total: filesTotal.count ?? 0,
        recent: filesRecent.count ?? 0,
      },
      documents: {
        total: documentsTotal.count ?? 0,
        pending: documentsPending.count ?? 0,
      },
      work: {
        hours_this_month: Math.round(hoursThisMonth * 100) / 100,
        open_tasks: openTasks.count ?? 0,
      },
      company: {
        entity_type: companyInfo.data?.legal_form || 'unknown',
        vat_payer: companyInfo.data?.vat_payer ?? false,
      },
      projects: {
        active: activeProjects.count ?? 0,
        cases: activeCases.count ?? 0,
      },
      attention: {
        total: 0,
        items: [],
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Hub stats GET error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
