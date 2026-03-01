import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

// Load Google OAuth credentials
function getGmailClient() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(process.env.HOME || '/root', '.claude/secrets/google_credentials.json')
  const tokenPath = process.env.GOOGLE_TOKEN_PATH || path.join(process.env.HOME || '/root', '.claude/secrets/google_token.json')

  if (!fs.existsSync(credPath) || !fs.existsSync(tokenPath)) {
    throw new Error('Google credentials or token not found')
  }

  const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'))
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'))

  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web || {}
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris?.[0])
  oauth2Client.setCredentials(token)

  // Auto-refresh token
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      const updated = { ...token, ...tokens }
      fs.writeFileSync(tokenPath, JSON.stringify(updated, null, 2))
    }
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export interface EmailMessage {
  id: string
  threadId: string
  from: string
  fromName: string
  to: string
  subject: string
  bodyText: string
  bodyHtml: string
  receivedAt: string
  hasAttachments: boolean
  attachments: Array<{
    filename: string
    mimeType: string
    size: number
    attachmentId: string
  }>
}

// Fetch new emails since last sync
export async function fetchNewEmails(
  emailAddress: string,
  sinceDate?: string,
  maxResults: number = 50,
  labelFilter?: string
): Promise<EmailMessage[]> {
  const gmail = getGmailClient()

  let query = `to:${emailAddress} OR deliveredto:${emailAddress}`
  if (sinceDate) {
    query += ` after:${sinceDate.replace(/-/g, '/')}`
  }
  if (labelFilter) {
    query += ` label:${labelFilter}`
  }

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults,
  })

  const messages = listRes.data.messages || []
  const emails: EmailMessage[] = []

  for (const msg of messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = detail.data.payload?.headers || []
      const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const fromRaw = getHeader('From')
      const fromMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/)
      const fromName = fromMatch ? fromMatch[1].replace(/"/g, '') : fromRaw
      const fromAddress = fromMatch ? fromMatch[2] : fromRaw

      // Parse body
      let bodyText = ''
      let bodyHtml = ''
      const payload = detail.data.payload

      function extractParts(parts: typeof payload) {
        if (!parts) return
        if (parts.mimeType === 'text/plain' && parts.body?.data) {
          bodyText = Buffer.from(parts.body.data, 'base64').toString('utf-8')
        }
        if (parts.mimeType === 'text/html' && parts.body?.data) {
          bodyHtml = Buffer.from(parts.body.data, 'base64').toString('utf-8')
        }
        if (parts.parts) {
          for (const part of parts.parts) {
            extractParts(part as typeof payload)
          }
        }
      }
      extractParts(payload)

      // Parse attachments
      const attachments: EmailMessage['attachments'] = []
      function findAttachments(parts: typeof payload) {
        if (!parts) return
        if (parts.filename && parts.body?.attachmentId) {
          attachments.push({
            filename: parts.filename,
            mimeType: parts.mimeType || 'application/octet-stream',
            size: parts.body.size || 0,
            attachmentId: parts.body.attachmentId,
          })
        }
        if (parts.parts) {
          for (const part of parts.parts) {
            findAttachments(part as typeof payload)
          }
        }
      }
      findAttachments(payload)

      const receivedAt = detail.data.internalDate
        ? new Date(parseInt(detail.data.internalDate)).toISOString()
        : new Date().toISOString()

      emails.push({
        id: msg.id!,
        threadId: msg.threadId || '',
        from: fromAddress,
        fromName,
        to: getHeader('To'),
        subject: getHeader('Subject') || '(bez předmětu)',
        bodyText,
        bodyHtml,
        receivedAt,
        hasAttachments: attachments.length > 0,
        attachments,
      })
    } catch (err) {
      console.error(`Failed to fetch email ${msg.id}:`, err)
    }
  }

  return emails
}

// Mark email as processed by adding a label
export async function markAsProcessed(messageId: string, labelName: string = 'Processed') {
  try {
    const gmail = getGmailClient()

    // Find or create the label
    const labelsRes = await gmail.users.labels.list({ userId: 'me' })
    let label = labelsRes.data.labels?.find(l => l.name === labelName)

    if (!label) {
      const newLabel = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      })
      label = newLabel.data
    }

    if (label?.id) {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [label.id],
        },
      })
    }
  } catch (err) {
    console.error('Failed to mark email as processed:', err)
  }
}
