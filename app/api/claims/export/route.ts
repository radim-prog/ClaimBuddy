import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  insuranceTypeLabel,
  insuranceStatusLabel,
  priorityLabel,
} from '@/lib/types/insurance'

export const dynamic = 'force-dynamic'

// GET /api/claims/export — CSV export of all insurance cases
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { data: cases, error } = await supabaseAdmin
      .from('insurance_cases')
      .select(
        `*,
         insurance_company:insurance_companies(name),
         company:companies!company_id(name),
         assigned_user:users!assigned_to(name)`
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    const header = [
      'Číslo spisu',
      'Firma',
      'Typ pojištění',
      'Pojišťovna',
      'Datum události',
      'Nárokovaná částka',
      'Schválená částka',
      'Vyplacená částka',
      'Status',
      'Priorita',
      'Řešitel',
      'Vytvořeno',
    ]

    const rows = (cases ?? []).map((c) => {
      const ic = c.insurance_company as { name: string } | null
      const comp = c.company as { name: string } | null
      const user = c.assigned_user as { name: string } | null
      return [
        c.case_number ?? '',
        comp?.name ?? '',
        insuranceTypeLabel(c.insurance_type),
        ic?.name ?? '',
        c.event_date ?? '',
        c.claimed_amount != null ? String(c.claimed_amount) : '',
        c.approved_amount != null ? String(c.approved_amount) : '',
        c.paid_amount != null ? String(c.paid_amount) : '',
        insuranceStatusLabel(c.status),
        priorityLabel(c.priority),
        user?.name ?? '',
        c.created_at ? new Date(c.created_at).toLocaleDateString('cs-CZ') : '',
      ]
    })

    const escapeCsv = (val: string) => {
      if (val.includes('"') || val.includes(',') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csvLines = [header, ...rows].map((row) => row.map(escapeCsv).join(','))
    // BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF'
    const csvContent = bom + csvLines.join('\r\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pojistne-pripady-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('[Claims export] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
