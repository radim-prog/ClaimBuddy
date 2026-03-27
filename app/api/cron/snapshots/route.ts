/*
 * snapshot_jobs table schema (run in Supabase SQL editor to create):
 *
 * create table snapshot_jobs (
 *   id             uuid primary key default gen_random_uuid(),
 *   firm_id        uuid not null references accounting_firms(id) on delete cascade,
 *   company_id     uuid not null references companies(id) on delete cascade,
 *   schedule       text not null check (schedule in ('daily', 'weekly', 'monthly')),
 *   retention_days int not null default 30,
 *   enabled        boolean not null default true,
 *   last_run       timestamptz,
 *   snapshot_count int not null default 0,
 *   created_at     timestamptz not null default now(),
 *   updated_at     timestamptz not null default now()
 * );
 *
 * create index on snapshot_jobs(firm_id);
 * create index on snapshot_jobs(company_id);
 * create index on snapshot_jobs(enabled, last_run);
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

type Schedule = 'daily' | 'weekly' | 'monthly'

interface SnapshotJob {
  id: string
  firm_id: string
  company_id: string
  schedule: Schedule
  retention_days: number
  enabled: boolean
  last_run: string | null
  snapshot_count: number
}

function getIntervalMs(schedule: Schedule): number {
  switch (schedule) {
    case 'daily':   return 24 * 60 * 60 * 1000
    case 'weekly':  return 7 * 24 * 60 * 60 * 1000
    case 'monthly': return 30 * 24 * 60 * 60 * 1000
  }
}

function isJobDue(job: SnapshotJob, now: Date): boolean {
  if (!job.last_run) return true
  const elapsed = now.getTime() - new Date(job.last_run).getTime()
  return elapsed >= getIntervalMs(job.schedule)
}

async function exportCompanyData(companyId: string): Promise<Record<string, unknown>> {
  const [documentsRes, invoicesRes, transactionsRes, closuresRes] = await Promise.all([
    supabaseAdmin
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null),
    supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId),
    supabaseAdmin
      .from('monthly_closures')
      .select('*')
      .eq('company_id', companyId),
  ])

  return {
    exported_at: new Date().toISOString(),
    company_id: companyId,
    documents:         documentsRes.data     || [],
    invoices:          invoicesRes.data       || [],
    bank_transactions: transactionsRes.data   || [],
    closures:          closuresRes.data        || [],
  }
}

async function runSnapshot(job: SnapshotJob, now: Date): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const payload = await exportCompanyData(job.company_id)
    const dateStr = now.toISOString().slice(0, 10)
    const storagePath = `${job.firm_id}/${job.company_id}/${dateStr}.json`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('snapshots')
      .upload(storagePath, JSON.stringify(payload, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const { error: updateError } = await supabaseAdmin
      .from('snapshot_jobs')
      .update({
        last_run: now.toISOString(),
        snapshot_count: job.snapshot_count + 1,
        updated_at: now.toISOString(),
      })
      .eq('id', job.id)

    if (updateError) {
      console.error(`[Snapshots] Failed to update job ${job.id}:`, updateError)
    }

    return { success: true, path: storagePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// POST /api/cron/snapshots
// Called by cron scheduler (e.g. systemd timer or Vercel cron)
// Authorization: Bearer <CRON_SECRET>
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured — rejecting cron request')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Fetch all enabled jobs
  const { data: jobs, error: fetchError } = await supabaseAdmin
    .from('snapshot_jobs')
    .select('*')
    .eq('enabled', true)

  if (fetchError) {
    console.error('[Snapshots] Failed to fetch jobs:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch snapshot jobs' }, { status: 500 })
  }

  const dueJobs = (jobs as SnapshotJob[]).filter(j => isJobDue(j, now))

  if (dueJobs.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No jobs due', timestamp: now.toISOString() })
  }

  const results = await Promise.all(
    dueJobs.map(async job => {
      const result = await runSnapshot(job, now)
      return { job_id: job.id, company_id: job.company_id, ...result }
    })
  )

  const succeeded = results.filter(r => r.success).length
  const failed    = results.filter(r => !r.success).length

  console.log(`[Snapshots] Processed ${dueJobs.length} jobs: ${succeeded} ok, ${failed} failed`)

  return NextResponse.json({
    processed: dueJobs.length,
    succeeded,
    failed,
    results,
    timestamp: now.toISOString(),
  })
}
