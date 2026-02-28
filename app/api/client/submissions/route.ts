import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// POST - save client extraction submissions to documents table
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const submissions = body.submissions

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json({ error: 'No submissions provided' }, { status: 400 })
    }

    const results = []

    for (const sub of submissions) {
      if (!sub.company_id) {
        results.push({ error: 'Missing company_id', file_name: sub.file_name })
        continue
      }

      const record: Record<string, unknown> = {
        company_id: sub.company_id,
        file_name: sub.file_name || 'document',
        type: sub.document_type || 'invoice',
        ocr_data: sub.extracted_data || null,
        ocr_status: 'submitted',
        ocr_processed: true,
        // Denormalized fields for quick filtering
        supplier_name: sub.extracted_data?.supplier_name || sub.extracted_data?.supplier?.name || null,
        supplier_ico: sub.extracted_data?.supplier_ico || sub.extracted_data?.supplier?.ico || null,
        supplier_dic: sub.extracted_data?.supplier_dic || sub.extracted_data?.supplier?.dic || null,
        confidence_score: sub.extracted_data?.confidence_score || null,
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert(record)
        .select('id')
        .single()

      if (error) {
        console.error('[Client Submissions] Insert error:', error)
        results.push({ error: error.message, file_name: sub.file_name })
      } else {
        results.push({ success: true, id: data.id, file_name: sub.file_name })
      }
    }

    return NextResponse.json({ results, count: results.filter(r => 'success' in r).length })
  } catch (error) {
    console.error('[Client Submissions] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - list user's submissions
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, company_id, file_name, type, ocr_status, supplier_name, confidence_score, uploaded_at, created_at')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (error) {
    console.error('[Client Submissions GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
