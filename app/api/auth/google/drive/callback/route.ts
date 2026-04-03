import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { saveFirmDriveCredentials } from '@/lib/google-drive-firm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/google/drive/callback?code=xxx&state=xxx
 * Exchanges the authorization code for tokens and saves them to the firm.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const stateParam = request.nextUrl.searchParams.get('state')
  const error = request.nextUrl.searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'
  const adminDrivePath = '/accountant/admin/operations'

  if (error) {
    console.error('[Drive OAuth] User denied consent:', error)
    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Přístup byl zamítnut')}`
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Chybí autorizační kód')}`
    )
  }

  // Decode state
  let firmId: string
  let userId: string
  try {
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    firmId = state.firmId
    userId = state.userId
    if (!firmId || !userId) throw new Error('Missing fields')
  } catch {
    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Neplatný state parametr')}`
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Google credentials nejsou nakonfigurovány')}`
    )
  }

  const redirectUri = `${appUrl}/api/auth/google/drive/callback`
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  try {
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Google nevrátil refresh token — zkuste znovu s prompt=consent')}`
      )
    }

    const saved = await saveFirmDriveCredentials(
      firmId,
      {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokens.refresh_token,
      },
      userId
    )

    if (!saved) {
      return NextResponse.redirect(
        `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent('Nepodařilo se uložit credentials')}`
      )
    }

    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_success=${encodeURIComponent('Google Drive úspěšně připojen')}`
    )
  } catch (err) {
    console.error('[Drive OAuth] Token exchange error:', err)
    const message = err instanceof Error ? err.message : 'Token exchange failed'
    return NextResponse.redirect(
      `${appUrl}${adminDrivePath}&drive_error=${encodeURIComponent(message)}`
    )
  }
}
