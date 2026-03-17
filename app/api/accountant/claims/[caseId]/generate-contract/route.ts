import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { resolveAutoFillData } from '@/lib/template-autofill'
import { generatePrikazniSmlouva } from '@/lib/contract-templates/prikazni-smlouva'
import { generatePlnaMoc } from '@/lib/contract-templates/plna-moc'

export const dynamic = 'force-dynamic'

/**
 * POST /api/accountant/claims/[caseId]/generate-contract
 * Body: { type: 'contract' | 'power_of_attorney' }
 * Creates a signing_job draft with the generated document text.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params
  const body = await request.json()
  const type = body.type as 'contract' | 'power_of_attorney'

  if (!type || !['contract', 'power_of_attorney'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Load insurance case
  const { data: ic, error: icError } = await supabaseAdmin
    .from('insurance_cases')
    .select('*, company:companies!insurance_cases_company_id_fkey(id, name, ico, email, managing_director, address, legal_form)')
    .eq('id', caseId)
    .single()

  if (icError || !ic) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }

  // Resolve autofill data
  const autoFill = await resolveAutoFillData({
    companyId: ic.company_id || undefined,
    insuranceCaseId: caseId,
    userId,
  })

  // Also get signer info from the company
  const signerName = ic.company?.managing_director || autoFill.podepisujici_jmeno || ''
  const signerEmail = ic.company?.email || autoFill.podepisujici_email || ''

  const contractData = {
    firma_nazev: autoFill.firma_nazev || ic.company?.name || '',
    firma_ico: autoFill.firma_ico || ic.company?.ico || '',
    firma_adresa: autoFill.firma_adresa || '',
    firma_jednatel: autoFill.firma_jednatel || ic.company?.managing_director || '',
    podepisujici_jmeno: signerName,
    podepisujici_email: signerEmail,
    ucetni_firma: autoFill.ucetni_firma || '',
    ucetni_jmeno: autoFill.ucetni_jmeno || '',
    ucetni_email: autoFill.ucetni_email || '',
    pu_cislo: autoFill.pu_cislo || ic.case_number || '',
    pojistovna_nazev: autoFill.pojistovna_nazev || '',
    pu_popis: autoFill.pu_popis || ic.event_description || '',
    pu_datum: autoFill.pu_datum || '',
    success_fee_procent: autoFill.success_fee_procent || '',
    fixni_odmena: autoFill.fixni_odmena || '',
    datum_dnes: autoFill.datum_dnes || new Date().toLocaleDateString('cs-CZ'),
  }

  // Generate document text
  const documentText = type === 'contract'
    ? generatePrikazniSmlouva(contractData)
    : generatePlnaMoc(contractData)

  const documentName = type === 'contract'
    ? `Příkazní smlouva — ${ic.case_number}`
    : `Plná moc — ${ic.case_number}`

  const documentType = type === 'contract' ? 'mandate' : 'power_of_attorney'

  // Create signing job (draft)
  const { data: job, error: jobError } = await supabaseAdmin
    .from('signing_jobs')
    .insert({
      company_id: ic.company_id,
      insurance_case_id: caseId,
      created_by: userId,
      document_name: documentName,
      document_type: documentType,
      signature_type: 'simple',
      status: 'draft',
      note: documentText,
    })
    .select()
    .single()

  if (jobError || !job) {
    console.error('[GenerateContract] Job create error:', jobError)
    return NextResponse.json({ error: 'Failed to create signing job' }, { status: 500 })
  }

  // Add signer if we have info
  if (signerName && signerEmail) {
    await supabaseAdmin.from('signing_signers').insert({
      signing_job_id: job.id,
      name: signerName,
      email: signerEmail,
      role: 'sign',
      status: 'waiting',
      order_index: 0,
    })
  }

  // Log event
  await supabaseAdmin.from('signing_events').insert({
    signing_job_id: job.id,
    event_type: 'created',
    actor: userId,
    description: `${type === 'contract' ? 'Příkazní smlouva' : 'Plná moc'} vygenerována pro ${ic.case_number}`,
    metadata: { insurance_case_id: caseId, type },
  })

  return NextResponse.json({
    success: true,
    job,
    documentText,
  })
}

/**
 * GET /api/accountant/claims/[caseId]/generate-contract
 * Returns signing jobs linked to this insurance case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { caseId } = await params

  const { data: jobs, error } = await supabaseAdmin
    .from('signing_jobs')
    .select('*, signers:signing_signers(*)')
    .eq('insurance_case_id', caseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GenerateContract] Fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }

  return NextResponse.json({ jobs: jobs || [] })
}
