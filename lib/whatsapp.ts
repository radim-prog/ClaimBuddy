/**
 * WhatsApp client via Evolution API v2
 * Self-hosted at evolution.zajcon.cz
 * Adapted from ~/Projects/Twilio/lib/evolution-client.ts
 *
 * Supports multi-instance: each firm can have its own Evolution instance
 * stored in the `evolution_instances` Supabase table.
 * All original exported functions remain backward-compatible (use env-var defaults).
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

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

export interface EvolutionInstance {
  id: string
  firm_id: string
  instance_name: string
  phone_number: string
  status: 'connected' | 'disconnected' | 'connecting'
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Core fetch helper
// Callers build the full path (including instance name) before calling this.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Default (env-var) instance — original public API, fully backward-compatible
// Every function accepts an optional instanceName; falls back to the env var.
// ---------------------------------------------------------------------------

/** Get connection state of the default WhatsApp instance */
export async function getConnectionState(instanceName?: string): Promise<ConnectionState> {
  const instance = instanceName ?? EVOLUTION_INSTANCE
  return evoFetch<ConnectionState>(`/instance/connectionState/${instance}`)
}

/** Trigger connection and get QR code for pairing */
export async function connectInstance(instanceName?: string): Promise<QRCodeResponse> {
  const instance = instanceName ?? EVOLUTION_INSTANCE
  return evoFetch<QRCodeResponse>(`/instance/connect/${instance}`)
}

/** Disconnect (logout) the WhatsApp instance */
export async function disconnectInstance(instanceName?: string): Promise<void> {
  const instance = instanceName ?? EVOLUTION_INSTANCE
  await evoFetch<unknown>(`/instance/logout/${instance}`, { method: 'DELETE' })
}

/** Restart the WhatsApp instance */
export async function restartInstance(instanceName?: string): Promise<void> {
  const instance = instanceName ?? EVOLUTION_INSTANCE
  await evoFetch<unknown>(`/instance/restart/${instance}`, { method: 'PUT' })
}

/**
 * Send a WhatsApp text message via the default (or specified) instance.
 * @param phoneNumber — E.164 format or local Czech (e.g. "+420123456789" or "420123456789")
 * @param text — message body
 * @param instanceName — optional instance override; defaults to EVOLUTION_INSTANCE env var
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  text: string,
  instanceName?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!EVOLUTION_API_KEY) {
    console.warn('[WhatsApp] EVOLUTION_API_KEY not configured')
    return { ok: false, error: 'EVOLUTION_API_KEY not configured' }
  }

  const instance = instanceName ?? EVOLUTION_INSTANCE

  try {
    // Normalize phone: strip non-digits, ensure starts with Czech country code
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
    const number = cleanNumber.startsWith('420') ? cleanNumber : `420${cleanNumber}`

    await evoFetch<unknown>(`/message/sendText/${instance}`, {
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

/** Check if the default (or specified) instance is currently connected */
export async function isWhatsAppConnected(instanceName?: string): Promise<boolean> {
  try {
    const state = await getConnectionState(instanceName)
    return state.instance.state === 'open'
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Multi-instance helpers — firm-aware
// ---------------------------------------------------------------------------

/**
 * Look up the Evolution instance configured for a given firm.
 * Returns null if no instance is registered for that firm.
 */
export async function getInstanceForFirm(firmId: string): Promise<EvolutionInstance | null> {
  const { data, error } = await supabaseAdmin
    .from('evolution_instances')
    .select('*')
    .eq('firm_id', firmId)
    .single()

  if (error || !data) {
    return null
  }

  return data as EvolutionInstance
}

/**
 * Send a WhatsApp message using the instance registered for a specific firm.
 * Falls back gracefully with { ok: false } if the firm has no instance configured
 * or if the instance is not currently connected.
 *
 * @param firmId — UUID of the firm (maps to evolution_instances.firm_id)
 * @param phoneNumber — E.164 or local Czech number
 * @param text — message body
 */
export async function sendWhatsAppMessageForFirm(
  firmId: string,
  phoneNumber: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const instance = await getInstanceForFirm(firmId)

  if (!instance) {
    console.warn(`[WhatsApp] No instance configured for firm ${firmId}`)
    return { ok: false, error: `No WhatsApp instance configured for firm ${firmId}` }
  }

  if (instance.status !== 'connected') {
    console.warn(
      `[WhatsApp] Instance "${instance.instance_name}" for firm ${firmId} is not connected (status: ${instance.status})`
    )
    return {
      ok: false,
      error: `WhatsApp instance "${instance.instance_name}" is not connected`,
    }
  }

  return sendWhatsAppMessage(phoneNumber, text, instance.instance_name)
}

/**
 * Get connection state for a firm's registered instance.
 * Returns null if no instance is registered for that firm or the API call fails.
 */
export async function getConnectionStateForFirm(
  firmId: string
): Promise<ConnectionState | null> {
  const instance = await getInstanceForFirm(firmId)
  if (!instance) return null

  try {
    return await getConnectionState(instance.instance_name)
  } catch {
    return null
  }
}
