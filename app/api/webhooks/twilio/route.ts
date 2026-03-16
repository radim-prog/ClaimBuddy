import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { addMessageToCompany } from '@/lib/message-store-db'
import twilio from 'twilio'

export const dynamic = 'force-dynamic'

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN

// Twilio WhatsApp webhook - receives incoming messages
export async function POST(request: NextRequest) {
  try {
    // Validate Twilio signature if auth token is configured
    if (TWILIO_AUTH_TOKEN) {
      const signature = request.headers.get('x-twilio-signature') || ''
      const url = request.url
      const clonedRequest = request.clone()
      const formDataForValidation = await clonedRequest.formData()
      const params: Record<string, string> = {}
      formDataForValidation.forEach((value, key) => { params[key] = value.toString() })

      const isValid = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params)
      if (!isValid) {
        console.warn('[Twilio] Invalid signature - rejecting request')
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    const formData = await request.formData()
    const from = formData.get('From') as string // e.g. whatsapp:+420123456789
    const body = formData.get('Body') as string
    const senderName = formData.get('ProfileName') as string || 'WhatsApp'

    if (!from || !body) {
      return new NextResponse('<Response/>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Extract phone number (remove whatsapp: prefix)
    const phoneNumber = from.replace('whatsapp:', '')

    // Look up company by phone number in whatsapp_config
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('company_id')
      .eq('phone_number', phoneNumber)
      .eq('enabled', true)
      .single()

    if (!config) {
      console.warn(`[Twilio] Unknown WhatsApp sender: ${phoneNumber}`)
      return new NextResponse('<Response/>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Save message to DB (sender_id uses a system placeholder since Twilio doesn't have user accounts)
    await addMessageToCompany({
      company_id: config.company_id,
      sender_id: '00000000-0000-0000-0000-000000000000',
      sender_type: 'client',
      sender_name: senderName,
      content: body,
    })

    // Return empty TwiML response
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('[Twilio webhook error]', error)
    return new NextResponse('<Response/>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}
