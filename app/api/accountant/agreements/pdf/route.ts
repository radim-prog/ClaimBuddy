import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole, canAccessCompany } from '@/lib/access-check'
import { AgreementPDF } from '@/lib/pdf/agreement-template'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const employeeId = request.nextUrl.searchParams.get('employee_id')
  if (!employeeId) return NextResponse.json({ error: 'Missing employee_id' }, { status: 400 })

  try {
    // Fetch employee
    const { data: employee, error: empErr } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (empErr || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Verify accountant can access this employee's company
    const impersonateCompany = request.headers.get('x-impersonate-company')
    const hasAccess = await canAccessCompany(userId!, userRole, employee.company_id, impersonateCompany)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify employee is DPP/DPČ
    if (employee.contract_type !== 'dpp' && employee.contract_type !== 'dpc') {
      return NextResponse.json({ error: 'Employee is not on DPP/DPČ contract' }, { status: 400 })
    }

    // Fetch company
    const { data: company, error: compErr } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', employee.company_id)
      .single()

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      AgreementPDF({ employee, company })
    )

    const contractType = employee.contract_type === 'dpp' ? 'DPP' : 'DPC'
    const filename = `${contractType}_${employee.last_name}_${employee.first_name}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Agreement PDF generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
