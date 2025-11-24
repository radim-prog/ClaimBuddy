import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const period = formData.get('period') as string
    const type = formData.get('type') as string

    if (!file || !companyId || !period || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate company ownership
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('owner_id, assigned_accountant_id')
      .eq('id', companyId)
      .single()

    if (companyError || !company || company.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate unique file name
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${companyId}/${period}/${type}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL (or signed URL for private storage)
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)

    // Insert document record to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        company_id: companyId,
        period,
        type,
        file_name: file.name,
        google_drive_file_id: storagePath, // Using storage path instead of Drive ID
        mime_type: file.type,
        file_size_bytes: file.size,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
        upload_source: 'web',
        status: 'uploaded',
        ocr_status: 'pending'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 })
    }

    // Update monthly_closures status
    const statusField = type === 'bank_statement' ? 'bank_statement_status' :
                       type === 'expense_invoice' ? 'expense_invoices_status' :
                       type === 'income_invoice' ? 'income_invoices_status' :
                       type === 'receipt' ? 'receipts_status' : null

    if (statusField) {
      // First, ensure monthly_closure exists
      const { data: existingClosure } = await supabase
        .from('monthly_closures')
        .select('id')
        .eq('company_id', companyId)
        .eq('period', period)
        .single()

      if (!existingClosure) {
        // Create new closure
        await supabase
          .from('monthly_closures')
          .insert({
            company_id: companyId,
            period,
            status: 'open',
            [statusField]: 'uploaded'
          })
      } else {
        // Update existing closure
        await supabase
          .from('monthly_closures')
          .update({
            [statusField]: 'uploaded',
            updated_at: new Date().toISOString()
          })
          .eq('company_id', companyId)
          .eq('period', period)
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        file_name: document.file_name,
        file_url: publicUrl,
        uploaded_at: document.uploaded_at
      }
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
