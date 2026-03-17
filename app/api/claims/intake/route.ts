import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createInsuranceCase } from '@/lib/insurance-store'
import type { InsuranceType } from '@/lib/types/insurance'

export const dynamic = 'force-dynamic'

const VALID_INSURANCE_TYPES: InsuranceType[] = ['auto', 'property', 'life', 'liability', 'travel', 'industrial', 'other']

const MAX_FILES = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.pdf', '.docx']

// POST /api/claims/intake — public endpoint for submitting insurance claims
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Parse the JSON payload
    const payloadStr = formData.get('payload') as string
    if (!payloadStr) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 })
    }

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(payloadStr)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // --- Validate required fields ---
    const errors: string[] = []

    const insuranceType = payload.insurance_type as InsuranceType
    if (!insuranceType || !VALID_INSURANCE_TYPES.includes(insuranceType)) {
      errors.push('Neplatný typ pojištění.')
    }

    const eventDate = payload.event_date as string
    if (!eventDate) errors.push('Datum události je povinné.')

    const eventDescription = payload.event_description as string
    if (!eventDescription || eventDescription.trim().length < 20) {
      errors.push('Popis události musí mít alespoň 20 znaků.')
    }

    const contactName = payload.contact_name as string
    if (!contactName || !contactName.trim()) errors.push('Jméno je povinné.')

    const contactEmail = payload.contact_email as string
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.push('Zadejte platný email.')
    }

    const contactPhone = payload.contact_phone as string
    if (!contactPhone || !/^\+?420\s?\d{3}\s?\d{3}\s?\d{3}$/.test(contactPhone.replace(/\s/g, ' ').trim())) {
      errors.push('Zadejte platný český telefon (+420...).')
    }

    const gdprConsent = payload.gdpr_consent as boolean
    if (!gdprConsent) errors.push('Souhlas se zpracováním osobních údajů je povinný.')

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
    }

    // --- Duplicate & linkage checks ---
    const insuranceCompanyId = payload.insurance_company_id as string | undefined
    const customCompanyName = payload.custom_company_name as string | undefined
    const eventLocation = payload.event_location as string | undefined
    const estimatedDamage = payload.estimated_damage ? Number(payload.estimated_damage) : undefined
    const normalizedEmail = contactEmail.toLowerCase().trim()

    // (a) Reject duplicate: same email + same insurance company + last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let duplicateQuery = supabaseAdmin
      .from('insurance_cases')
      .select('id, case_number', { count: 'exact', head: false })
      .eq('contact_email', normalizedEmail)
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (insuranceCompanyId) {
      duplicateQuery = duplicateQuery.eq('insurance_company_id', insuranceCompanyId)
    }

    const { data: duplicates } = await duplicateQuery.limit(1)

    if (duplicates && duplicates.length > 0) {
      return NextResponse.json(
        { error: 'Událost s tímto emailem již byla nahlášena. Pokud chcete doplnit informace, kontaktujte nás.' },
        { status: 409 }
      )
    }

    // (b) Link existing user by email → find their company
    let linkedCompanyId: string | undefined
    let linkedUserId: string | undefined

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)
      .single()

    if (existingUser) {
      linkedUserId = existingUser.id

      // Find company owned by this user
      const { data: ownedCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('owner_id', existingUser.id)
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (ownedCompany) {
        linkedCompanyId = ownedCompany.id
      }
    }

    // (b2) Fallback: find company by matching email directly
    if (!linkedCompanyId) {
      const { data: companyByEmail } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('email', normalizedEmail)
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (companyByEmail) {
        linkedCompanyId = companyByEmail.id
      }
    }

    // (c) Link existing company by IČO (if provided in payload)
    const contactIco = payload.contact_ico as string | undefined
    if (!linkedCompanyId && contactIco) {
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('ico', contactIco.trim())
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (existingCompany) {
        linkedCompanyId = existingCompany.id
      }
    }

    // --- Create the case ---

    // Build note with custom company name + metadata
    const noteParts: string[] = []
    if (customCompanyName) noteParts.push(`Pojišťovna (jiná): ${customCompanyName}`)
    if (estimatedDamage) noteParts.push(`Odhadovaná škoda: ${new Intl.NumberFormat('cs-CZ').format(estimatedDamage)} Kč`)
    noteParts.push('Zdroj: Veřejný formulář')

    const created = await createInsuranceCase(
      {
        insurance_type: insuranceType,
        insurance_company_id: insuranceCompanyId || undefined,
        company_id: linkedCompanyId,
        event_date: eventDate,
        event_description: eventDescription.trim(),
        event_location: eventLocation || undefined,
        claimed_amount: estimatedDamage || undefined,
        priority: 'normal',
        note: noteParts.join('\n'),
        tags: ['intake', 'public-form'],
        contact_name: contactName.trim(),
        contact_email: normalizedEmail,
        contact_phone: contactPhone.trim(),
        contact_user_id: linkedUserId,
      },
      'system' // created by system (public form)
    )

    // --- Upload attached files ---
    const fileKeys = Array.from(formData.keys()).filter(k => k.startsWith('file_'))
    const uploadedFiles: string[] = []

    if (fileKeys.length > MAX_FILES) {
      console.warn(`[Intake] Too many files (${fileKeys.length}), truncating to ${MAX_FILES}`)
    }

    for (const key of fileKeys.slice(0, MAX_FILES)) {
      const file = formData.get(key) as File
      if (!file || !(file instanceof File)) continue

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`[Intake] File ${file.name} too large (${file.size}), skipping`)
        continue
      }

      // Validate type
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
      const mimeOk = ALLOWED_MIME_PREFIXES.some(p => file.type.startsWith(p)) || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const extOk = ALLOWED_EXTENSIONS.includes(ext)
      if (!mimeOk && !extOk) {
        console.warn(`[Intake] File ${file.name} has invalid type (${file.type}), skipping`)
        continue
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `claims/${created.id}/${Date.now()}_${safeName}`

        const { error: storageError } = await supabaseAdmin.storage
          .from('documents')
          .upload(storagePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
          })

        if (storageError) {
          console.error(`[Intake] Storage upload error for ${file.name}:`, storageError)
          continue
        }

        // Record as case document
        await supabaseAdmin.from('insurance_case_documents').insert({
          case_id: created.id,
          name: file.name,
          file_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          document_type: 'claim_report',
          note: 'Nahráno přes veřejný formulář',
        })

        uploadedFiles.push(file.name)
      } catch (err) {
        console.error(`[Intake] Error uploading ${file.name}:`, err)
      }
    }

    return NextResponse.json(
      {
        success: true,
        case_number: created.case_number,
        case_id: created.id,
        uploaded_files: uploadedFiles.length,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Claims intake] POST error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
