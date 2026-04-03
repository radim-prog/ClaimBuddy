import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/google/drive?firmId=xxx
 * Redirects admin to Google OAuth2 consent screen for Drive access.
 * The firmId is passed through the OAuth state parameter.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const firmId = request.nextUrl.searchParams.get('firmId')
  if (!firmId) {
    return NextResponse.json({ error: 'firmId is required' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Google OAuth credentials not configured on server' },
      { status: 500 }
    )
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.zajcon.cz'}/api/auth/google/drive/callback`

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  // State encodes firmId + userId for the callback
  const state = Buffer.from(JSON.stringify({ firmId, userId })).toString('base64url')

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
    state,
  })

  return NextResponse.redirect(authUrl)
}
