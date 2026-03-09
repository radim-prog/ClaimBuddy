export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/time-entries - List time entries
 *
 * Query params:
 * - company_id: UUID (required or all)
 * - task_id: UUID
 * - period: YYYY-MM (filter by month)
 * - date_from: YYYY-MM-DD
 * - date_to: YYYY-MM-DD
 * - billable: boolean
 * - in_tariff: boolean
 * - limit: number (default 50)
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const taskId = searchParams.get('task_id')
  const period = searchParams.get('period')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const billable = searchParams.get('billable')
  const inTariff = searchParams.get('in_tariff')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  let query = supabaseAdmin
    .from('time_logs')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (companyId) query = query.eq('company_id', companyId)
  if (taskId) query = query.eq('task_id', taskId)
  if (billable !== null && billable !== undefined && billable !== '') {
    query = query.eq('billable', billable === 'true')
  }
  if (inTariff !== null && inTariff !== undefined && inTariff !== '') {
    query = query.eq('in_tariff', inTariff === 'true')
  }

  // Period filter (YYYY-MM)
  if (period && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-').map(Number)
    const firstDay = `${period}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    query = query.gte('date', firstDay).lte('date', lastDay)
  } else {
    if (dateFrom) query = query.gte('date', dateFrom)
    if (dateTo) query = query.lte('date', dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Time entries fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entries: data || [] })
}

/**
 * POST /api/time-entries - Create a time entry
 *
 * Body:
 * {
 *   company_id: UUID (required)
 *   task_id?: UUID
 *   date: YYYY-MM-DD (required)
 *   hours?: number (decimal, e.g. 1.5)
 *   minutes?: number (integer)
 *   description: string (required)
 *   task_title?: string
 *   billable?: boolean (default true)
 *   in_tariff?: boolean (default false)
 *   hourly_rate?: number
 * }
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userName = request.headers.get('x-user-name') || 'Účetní'
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    if (!body.company_id) {
      return NextResponse.json({ error: 'company_id je povinné' }, { status: 400 })
    }
    if (!body.date) {
      return NextResponse.json({ error: 'date je povinné' }, { status: 400 })
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'description je povinné' }, { status: 400 })
    }

    // Calculate hours from minutes or use provided hours
    let hours = body.hours || 0
    let minutes = body.minutes || 0
    if (minutes > 0 && hours === 0) {
      hours = minutes / 60
    } else if (hours > 0 && minutes === 0) {
      minutes = Math.round(hours * 60)
    }

    if (hours <= 0 && minutes <= 0) {
      return NextResponse.json({ error: 'Zadejte čas (hours nebo minutes)' }, { status: 400 })
    }

    // Get company name and default hourly rate
    let companyName = body.company_name || ''
    let hourlyRate = body.hourly_rate

    if (!companyName || hourlyRate === undefined) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('name, default_hourly_rate')
        .eq('id', body.company_id)
        .single()

      if (company) {
        if (!companyName) companyName = company.name
        if (hourlyRate === undefined) hourlyRate = company.default_hourly_rate || 700
      }
    }

    const entry: Record<string, unknown> = {
      company_id: body.company_id,
      company_name: companyName,
      user_id: userId,
      user_name: userName,
      date: body.date,
      hours: Math.round(hours * 100) / 100,
      minutes,
      description: body.description.trim(),
      task_id: body.task_id || null,
      task_title: body.task_title || null,
      note: body.note || null,
      billable: body.billable !== false,
      in_tariff: body.in_tariff === true,
      hourly_rate: hourlyRate || 700,
      prepaid_project_id: body.prepaid_project_id || null,
    }

    const { data, error } = await supabaseAdmin
      .from('time_logs')
      .insert(entry)
      .select()
      .single()

    if (error) {
      console.error('Time entry create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update prepaid project consumed hours if linked
    if (body.prepaid_project_id && data) {
      const entryHours = Number(data.hours) || 0
      const entryRate = Number(data.hourly_rate) || 700

      const { data: project } = await supabaseAdmin
        .from('prepaid_projects')
        .select('consumed_hours, consumed_amount, estimated_hours, hourly_rate, total_budget, notified_80, notified_100, notify_at_80, notify_at_100')
        .eq('id', body.prepaid_project_id)
        .single()

      if (project) {
        const newConsumedHours = Number(project.consumed_hours) + entryHours
        const newConsumedAmount = Number(project.consumed_amount) + (entryHours * entryRate)
        const totalBudget = Number(project.total_budget)
        const consumptionPct = totalBudget > 0 ? (newConsumedAmount / totalBudget) * 100 : 0

        const shouldNotify80 = consumptionPct >= 80 && !project.notified_80
        const shouldNotify100 = consumptionPct >= 100 && !project.notified_100

        await supabaseAdmin
          .from('prepaid_projects')
          .update({
            consumed_hours: newConsumedHours,
            consumed_amount: newConsumedAmount,
            notified_80: consumptionPct >= 80 ? true : project.notified_80,
            notified_100: consumptionPct >= 100 ? true : project.notified_100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.prepaid_project_id)

        // Fetch project title for notification
        if (shouldNotify80 || shouldNotify100) {
          const { data: projDetail } = await supabaseAdmin
            .from('prepaid_projects')
            .select('title')
            .eq('id', body.prepaid_project_id)
            .single()

          const projTitle = projDetail?.title || 'Prepaid projekt'
          const formatAmount = (n: number) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n)

          if (shouldNotify100) {
            await supabaseAdmin.from('client_notifications').insert({
              company_id: body.company_id,
              type: 'prepaid_budget_exhausted',
              title: `${projTitle} — rozpočet vyčerpán!`,
              message: `Spotřebováno ${newConsumedHours.toFixed(1)}h z ${project.estimated_hours}h (${formatAmount(newConsumedAmount)} z ${formatAmount(totalBudget)}). Kontaktujte vedení firmy.`,
              severity: 'urgent',
              auto_generated: true,
            })
          } else if (shouldNotify80) {
            await supabaseAdmin.from('client_notifications').insert({
              company_id: body.company_id,
              type: 'prepaid_budget_warning',
              title: `${projTitle} — spotřebováno ${Math.round(consumptionPct)}%`,
              message: `Spotřebováno ${newConsumedHours.toFixed(1)}h z ${project.estimated_hours}h (${formatAmount(newConsumedAmount)} z ${formatAmount(totalBudget)}). Zvažte kontakt s vedením.`,
              severity: 'warning',
              auto_generated: true,
            })
          }
        }
      }
    }

    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (err) {
    console.error('Time entry POST error:', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * PATCH /api/time-entries - Update a time entry
 *
 * Body:
 * {
 *   id: UUID (required)
 *   date?: YYYY-MM-DD
 *   minutes?: number
 *   description?: string
 *   billable?: boolean
 *   in_tariff?: boolean
 *   prepaid_project_id?: string | null
 * }
 */
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id je povinné' }, { status: 400 })
    }

    // Fetch the existing entry
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('time_logs')
      .select('*')
      .eq('id', body.id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Záznam nenalezen' }, { status: 404 })
    }

    // Build update object
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.date !== undefined) update.date = body.date
    if (body.description !== undefined) update.description = body.description.trim()
    if (body.billable !== undefined) update.billable = body.billable
    if (body.in_tariff !== undefined) update.in_tariff = body.in_tariff

    // Recalculate hours from minutes
    if (body.minutes !== undefined) {
      const minutes = body.minutes
      const hours = minutes / 60
      update.minutes = minutes
      update.hours = Math.round(hours * 100) / 100
    }

    // Handle prepaid project change
    const oldPrepaidId = existing.prepaid_project_id
    const newPrepaidId = body.prepaid_project_id !== undefined ? (body.prepaid_project_id || null) : oldPrepaidId
    update.prepaid_project_id = newPrepaidId

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('time_logs')
      .update(update)
      .eq('id', body.id)
      .select()
      .single()

    if (updateErr) {
      console.error('Time entry PATCH error:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Recalculate prepaid projects if prepaid_project_id changed
    if (oldPrepaidId !== newPrepaidId) {
      const entryHours = Number(updated.hours) || 0
      const entryRate = Number(updated.hourly_rate) || 700

      // Remove from old prepaid project
      if (oldPrepaidId) {
        const { data: oldProject } = await supabaseAdmin
          .from('prepaid_projects')
          .select('consumed_hours, consumed_amount')
          .eq('id', oldPrepaidId)
          .single()

        if (oldProject) {
          await supabaseAdmin
            .from('prepaid_projects')
            .update({
              consumed_hours: Math.max(0, Number(oldProject.consumed_hours) - entryHours),
              consumed_amount: Math.max(0, Number(oldProject.consumed_amount) - (entryHours * entryRate)),
              updated_at: new Date().toISOString(),
            })
            .eq('id', oldPrepaidId)
        }
      }

      // Add to new prepaid project
      if (newPrepaidId) {
        const { data: newProject } = await supabaseAdmin
          .from('prepaid_projects')
          .select('consumed_hours, consumed_amount')
          .eq('id', newPrepaidId)
          .single()

        if (newProject) {
          await supabaseAdmin
            .from('prepaid_projects')
            .update({
              consumed_hours: Number(newProject.consumed_hours) + entryHours,
              consumed_amount: Number(newProject.consumed_amount) + (entryHours * entryRate),
              updated_at: new Date().toISOString(),
            })
            .eq('id', newPrepaidId)
        }
      }
    }

    return NextResponse.json({ entry: updated })
  } catch (err) {
    console.error('Time entry PATCH error:', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

/**
 * DELETE /api/time-entries?id=UUID - Delete a time entry
 */
export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id je povinné' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('time_logs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Time entry delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
