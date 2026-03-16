import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole } from '@/lib/access-check'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSession, updateSession, upsertFuelData, deleteFuelDataBySession } from '@/lib/travel-generation-store'
import { detectFuelDocument } from '@/lib/fuel-extractor'

export const dynamic = 'force-dynamic'

// POST: Tag documents for travel session + extract fuel data
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string; sessionId: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const session = await getSession(params.sessionId)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    if (session.company_id !== params.companyId) {
      return NextResponse.json({ error: 'Session mismatch' }, { status: 403 })
    }

    const body = await request.json()
    const { document_ids } = body as { document_ids: string[] }

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids required' }, { status: 400 })
    }

    // Fetch selected documents
    const { data: documents, error: docError } = await supabaseAdmin
      .from('documents')
      .select('id, ocr_data, supplier_name, type, date_issued, total_with_vat')
      .in('id', document_ids)
      .eq('company_id', params.companyId)

    if (docError) throw docError

    // Tag documents
    await supabaseAdmin
      .from('documents')
      .update({ travel_tagged: true, travel_session_id: params.sessionId })
      .in('id', document_ids)
      .eq('company_id', params.companyId)

    // Clear existing fuel data for this session
    await deleteFuelDataBySession(params.sessionId)

    // Extract fuel data from each document
    const fuelItems: Array<{
      document_id: string | null
      vehicle_id: string | null
      log_date: string
      liters: number
      price_per_liter: number | null
      total_price: number | null
      odometer: number | null
      station_name: string | null
      source: 'ocr' | 'manual' | 'existing_fuel_log'
      confidence: number
      raw_ocr_fields: Record<string, unknown> | null
      manually_edited: boolean
    }> = []

    for (const doc of (documents || [])) {
      const detection = detectFuelDocument(
        doc.id,
        doc.ocr_data as Record<string, unknown> | null,
        doc.supplier_name,
        doc.type
      )

      if (detection.extracted) {
        fuelItems.push({
          document_id: doc.id,
          vehicle_id: null,
          log_date: detection.extracted.log_date,
          liters: detection.extracted.liters,
          price_per_liter: detection.extracted.price_per_liter,
          total_price: detection.extracted.total_price,
          odometer: detection.extracted.odometer,
          station_name: detection.extracted.station_name,
          source: 'ocr',
          confidence: detection.extracted.confidence,
          raw_ocr_fields: detection.extracted.raw_ocr_fields,
          manually_edited: false,
        })
      } else {
        // Document tagged but no fuel data extracted — add placeholder
        fuelItems.push({
          document_id: doc.id,
          vehicle_id: null,
          log_date: doc.date_issued || new Date().toISOString().split('T')[0],
          liters: 0,
          price_per_liter: null,
          total_price: doc.total_with_vat || null,
          odometer: null,
          station_name: doc.supplier_name || null,
          source: 'manual',
          confidence: 0,
          raw_ocr_fields: null,
          manually_edited: false,
        })
      }
    }

    const savedFuel = fuelItems.length > 0 ? await upsertFuelData(params.sessionId, fuelItems) : []

    // Update session status
    await updateSession(params.sessionId, { status: 'documents_selected' })

    return NextResponse.json({
      tagged_count: document_ids.length,
      fuel_data: savedFuel,
      extracted_count: fuelItems.filter(f => f.source === 'ocr').length,
      manual_count: fuelItems.filter(f => f.source === 'manual').length,
    })
  } catch (error) {
    console.error('Tag documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
