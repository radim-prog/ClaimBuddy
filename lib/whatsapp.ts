/**
 * WhatsApp client via Evolution API v2
 * Self-hosted at evolution.zajcon.cz
 * Adapted from ~/Projects/Twilio/lib/evolution-client.ts
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution.zajcon.cz'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'ucetni-webapp'

export interface ConnectionState {
  instance: {
    instanceName: string
    state: 'open' | 'close' | 'connecting'
  }
}

export interface QRCodeResponse {
  pairingCode?: string
  code?: string
  base64?: string
  count: number
}

async function evoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!EVOLUTION_API_KEY) {
    throw new Error('EVOLUTION_API_KEY not configured')
  }

  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Evolution API ${res.status}: ${errText}`)
  }

  return res.json()
}

/** Get connection state of the WhatsApp instance */
export async function getConnectionState(): Promise<ConnectionState> {
  return evoFetch<ConnectionState>(`/instance/connectionState/${EVOLUTION_INSTANCE}`)
}

/** Trigger connection and get QR code for pairing */
export async function connectInstance(): Promise<QRCodeResponse> {
  return evoFetch<QRCodeResponse>(`/instance/connect/${EVOLUTION_INSTANCE}`)
}

/** Disconnect (logout) the WhatsApp instance */
export async function disconnectInstance(): Promise<void> {
  await evoFetch<unknown>(`/instance/logout/${EVOLUTION_INSTANCE}`, { method: 'DELETE' })
}

/** Restart the WhatsApp instance */
export async function restartInstance(): Promise<void> {
  await evoFetch<unknown>(`/instance/restart/${EVOLUTION_INSTANCE}`, { method: 'PUT' })
}

/**
 * Send a WhatsApp text message
 * @param phoneNumber — E.164 format or local Czech (e.g. "+420123456789" or "420123456789")
 * @param text — message body
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  if (!EVOLUTION_API_KEY) {
    console.warn('[WhatsApp] EVOLUTION_API_KEY not configured')
    return { ok: false, error: 'EVOLUTION_API_KEY not configured' }
  }

  try {
    // Normalize phone: strip +, ensure starts with country code
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
    const number = cleanNumber.startsWith('420') ? cleanNumber : `420${cleanNumber}`

    await evoFetch<unknown>(`/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      body: JSON.stringify({ number, text }),
    })

    return { ok: true }
  } catch (err) {
    console.error('[WhatsApp] Send error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' }
  }
}

/** Check if WhatsApp (Evolution API) is configured */
export function isWhatsAppConfigured(): boolean {
  return !!EVOLUTION_API_KEY
}

/** Check if the instance is currently connected */
export async function isWhatsAppConnected(): Promise<boolean> {
  try {
    const state = await getConnectionState()
    return state.instance.state === 'open'
  } catch {
    return false
  }
}
