import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isStaffRole } from '@/lib/access-check'
import { sendEmail } from '@/lib/email-service'
import { marketplaceResponse } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

// GET: List marketplace requests for accountant's provider
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    // Find provider linked to this accountant user
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!provider) {
      return NextResponse.json({ requests: [], provider_registered: false })
    }

    let query = supabaseAdmin
      .from('marketplace_requests')
      .select('id, client_user_id, client_company_id, status, message, business_type, budget_range, created_at, responded_at, users!client_user_id(name, email), companies!client_company_id(name, ico)')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
      // Fallback without join
      let fallback = supabaseAdmin
        .from('marketplace_requests')
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (status) fallback = fallback.eq('status', status)
      const { data: fbData, error: fbErr } = await fallback
      if (fbErr) throw fbErr
      return NextResponse.json({ requests: fbData || [], provider_registered: true })
    }

    const requests = (data || []).map((r: any) => ({
      id: r.id,
      client_name: r.users?.name || null,
      client_email: r.users?.email || null,
      company_name: r.companies?.name || null,
      company_ico: r.companies?.ico || null,
      status: r.status,
      message: r.message,
      business_type: r.business_type,
      budget_range: r.budget_range,
      created_at: r.created_at,
      responded_at: r.responded_at,
    }))

    return NextResponse.json({ requests, provider_registered: true })
  } catch (error) {
    console.error('[AcctMarketplaceRequests] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Accept or reject a marketplace request
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isStaffRole(userRole)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await request.json()
    const { request_id, action, rejection_reason } = body

    if (!request_id || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Missing request_id or invalid action' }, { status: 400 })
    }

    // Verify this request belongs to the accountant's provider
    const { data: provider } = await supabaseAdmin
      .from('marketplace_providers')
      .select('id, name')
      .eq('user_id', userId)
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'No marketplace provider found' }, { status: 404 })
    }

    const { data: req } = await supabaseAdmin
      .from('marketplace_requests')
      .select('id, status, client_user_id, client_company_id, provider_id')
      .eq('id', request_id)
      .eq('provider_id', provider.id)
      .single()

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (req.status !== 'pending') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected'

    const { error: updateErr } = await supabaseAdmin
      .from('marketplace_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        responded_by: userId,
        rejection_reason: action === 'reject' ? (rejection_reason || null) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request_id)

    if (updateErr) throw updateErr

    // On accept: assign accountant to client's company
    if (action === 'accept' && req.client_company_id) {
      await supabaseAdmin
        .from('companies')
        .update({
          assigned_accountant_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', req.client_company_id)
        .is('assigned_accountant_id', null) // Only assign if not already assigned
    }

    // Notify client via email
    const { data: clientUser } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', req.client_user_id)
      .single()

    if (clientUser?.email) {
      const template = marketplaceResponse(
        clientUser.name || 'klienti',
        provider.name,
        action === 'accept'
      )
      await sendEmail({
        to: clientUser.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }).catch(err => console.error('[MarketplaceRequest] Email error:', err))
    }

    // Create in-app notification for client (best effort)
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: req.client_user_id,
        type: action === 'accept' ? 'marketplace_accepted' : 'marketplace_rejected',
        title: action === 'accept'
          ? `${provider.name} přijala vaši žádost`
          : `Odpověď na vaši žádost od ${provider.name}`,
        message: action === 'accept'
          ? `Účetní firma ${provider.name} přijala vaši žádost o spolupráci. Můžete ji kontaktovat přímo v aplikaci.`
          : `Bohužel ${provider.name} nemůže přijmout nové klienty.${rejection_reason ? ` Důvod: ${rejection_reason}` : ''}`,
        metadata: { request_id, provider_name: provider.name },
      })
    } catch { /* best effort */ }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('[AcctMarketplaceRequests] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
