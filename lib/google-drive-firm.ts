import { google } from 'googleapis'
import type { drive_v3 } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { decrypt, encrypt, isEncrypted } from '@/lib/crypto'

interface FirmDriveCredentials {
  client_id?: string
  client_secret?: string
  refresh_token?: string
  root_folder_id?: string
  connected_at?: string
  connected_by?: string
}

/**
 * Create a Google Drive client for a specific accounting firm.
 * Falls back to global credentials if firm has none configured.
 */
export function createFirmDriveClient(credentials: FirmDriveCredentials | null): drive_v3.Drive | null {
  const clientId = credentials?.client_id || process.env.GOOGLE_CLIENT_ID
  const clientSecret = credentials?.client_secret || process.env.GOOGLE_CLIENT_SECRET
  let refreshToken = credentials?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  // Decrypt refresh token if encrypted
  if (isEncrypted(refreshToken)) {
    try {
      refreshToken = decrypt(refreshToken)
    } catch {
      console.error('[Drive] Failed to decrypt refresh token')
      return null
    }
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

/**
 * Get Drive client for a firm by firm ID.
 * Loads credentials from DB, falls back to env.
 */
export async function getDriveClientForFirm(firmId: string): Promise<{
  drive: drive_v3.Drive | null
  rootFolderId: string | null
  isGlobal: boolean
}> {
  const { data: firm } = await supabaseAdmin
    .from('accounting_firms')
    .select('google_drive_credentials')
    .eq('id', firmId)
    .single()

  const creds = firm?.google_drive_credentials as FirmDriveCredentials | null

  if (creds?.refresh_token) {
    const drive = createFirmDriveClient(creds)
    return {
      drive,
      rootFolderId: creds.root_folder_id || null,
      isGlobal: false,
    }
  }

  // Fallback to global
  const drive = createFirmDriveClient(null)
  return {
    drive,
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null,
    isGlobal: true,
  }
}

/**
 * Save Drive credentials for a firm (encrypted).
 */
export async function saveFirmDriveCredentials(
  firmId: string,
  credentials: {
    client_id: string
    client_secret: string
    refresh_token: string
    root_folder_id?: string
  },
  userId: string
): Promise<boolean> {
  const encryptedCreds: FirmDriveCredentials = {
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: encrypt(credentials.refresh_token),
    root_folder_id: credentials.root_folder_id || undefined,
    connected_at: new Date().toISOString(),
    connected_by: userId,
  }

  const { error } = await supabaseAdmin
    .from('accounting_firms')
    .update({
      google_drive_credentials: encryptedCreds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', firmId)

  if (error) {
    console.error('[Drive] Save credentials error:', error)
    return false
  }
  return true
}

/**
 * Disconnect Drive for a firm.
 */
export async function disconnectFirmDrive(firmId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('accounting_firms')
    .update({
      google_drive_credentials: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', firmId)

  if (error) {
    console.error('[Drive] Disconnect error:', error)
    return false
  }
  return true
}

/**
 * Test Drive connection for a firm.
 */
export async function testFirmDriveConnection(firmId: string): Promise<{
  connected: boolean
  email?: string
  rootFolderName?: string
  error?: string
}> {
  const { drive, rootFolderId } = await getDriveClientForFirm(firmId)

  if (!drive) {
    return { connected: false, error: 'No Drive credentials configured' }
  }

  try {
    // Test: get about info
    const about = await drive.about.get({ fields: 'user' })
    const email = about.data.user?.emailAddress || undefined

    let rootFolderName: string | undefined
    if (rootFolderId) {
      try {
        const folder = await drive.files.get({
          fileId: rootFolderId,
          fields: 'name',
          supportsAllDrives: true,
        })
        rootFolderName = folder.data.name || undefined
      } catch {
        // Root folder not accessible
      }
    }

    return {
      connected: true,
      email,
      rootFolderName,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return { connected: false, error: message }
  }
}
