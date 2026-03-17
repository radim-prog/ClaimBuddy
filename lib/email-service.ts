// Email sending abstraction layer
// Priority: Ecomail (transactional) → SendGrid → Log only (dev)

import { sendTransactional, sendTemplate } from './ecomail-client'
import { supabaseAdmin } from './supabase-admin'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailConfig {
  to: string | string[]
  from?: string // default: EMAIL_FROM_NOREPLY env var
  subject: string
  template?: string // Ecomail template ID (numeric string, e.g. "42")
  templateData?: Record<string, string> // merge vars for Ecomail templates
  html?: string // direct HTML (fallback when no template)
  text?: string // plain-text version
  attachments?: { filename: string; content: string; type: string }[]
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  provider: 'ecomail' | 'sendgrid' | 'logged'
  messageId?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_FROM = process.env.EMAIL_FROM_NOREPLY || 'noreply@ucetnios.cz'
const DEFAULT_FROM_NAME = 'ÚčetníOS'

function normalizeRecipients(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to]
}

async function logEmail(
  config: EmailConfig,
  result: EmailResult
): Promise<void> {
  const recipients = normalizeRecipients(config.to)
  // Log one row per recipient so queries by recipient are simple
  for (const recipient of recipients) {
    try {
      await supabaseAdmin.from('notification_log').insert({
        type: 'email',
        template: config.template ?? 'custom',
        recipient,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        metadata: {
          subject: config.subject,
          from: config.from ?? DEFAULT_FROM,
          ...(result.error && { error: result.error }),
        },
      })
    } catch (logError) {
      // Never let logging errors surface to the caller
      console.error('[EmailService] Failed to write notification_log:', logError)
    }
  }
}

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

export async function sendEmail(config: EmailConfig): Promise<EmailResult> {
  const recipients = normalizeRecipients(config.to)
  const fromEmail = config.from ?? DEFAULT_FROM

  // ------- Priority 1: Ecomail -------
  const ecomailKey = process.env.ECOMAIL_API_KEY
  if (ecomailKey) {
    try {
      const ecomailConfig = { apiKey: ecomailKey }
      const toList = recipients.map((email) => ({ email }))

      let response: Record<string, unknown>

      if (config.template) {
        const templateId = parseInt(config.template, 10)
        if (isNaN(templateId)) {
          throw new Error(`Invalid Ecomail template ID: "${config.template}" — must be numeric`)
        }

        const mergeVars = config.templateData
          ? Object.entries(config.templateData).map(([name, content]) => ({
              name,
              content,
            }))
          : undefined

        response = await sendTemplate(ecomailConfig, {
          templateId,
          to: toList,
          mergeVars,
          from: { email: fromEmail, name: DEFAULT_FROM_NAME },
        })
      } else if (config.html) {
        response = await sendTransactional(ecomailConfig, {
          from: { email: fromEmail, name: DEFAULT_FROM_NAME },
          to: toList,
          subject: config.subject,
          htmlBody: config.html,
          textBody: config.text,
        })
      } else {
        throw new Error('Ecomail requires either config.template or config.html')
      }

      const result: EmailResult = {
        success: true,
        provider: 'ecomail',
        messageId: typeof response.id === 'string' ? response.id : undefined,
      }
      await logEmail(config, result)
      return result
    } catch (err) {
      console.error('[EmailService] Ecomail error:', err)
      // Fall through to next provider
    }
  }

  // ------- Priority 2: SMTP (Wedos / nodemailer) -------
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = (await import('nodemailer')).default
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: (process.env.SMTP_PORT || '465') === '465',
        auth: { user: smtpUser, pass: smtpPass },
      })

      const info = await transporter.sendMail({
        from: `${DEFAULT_FROM_NAME} <${fromEmail}>`,
        to: recipients.join(', '),
        subject: config.subject,
        html: config.html,
        text: config.text,
        ...(config.replyTo && { replyTo: config.replyTo }),
      })

      const result: EmailResult = {
        success: true,
        provider: 'sendgrid' as const, // reuse type — SMTP is our new priority
        messageId: info.messageId,
      }
      await logEmail(config, result)
      return result
    } catch (err) {
      console.error('[EmailService] SMTP error:', err)
      // Fall through to next provider
    }
  }

  // ------- Priority 3: SendGrid -------
  const sendgridKey = process.env.SENDGRID_API_KEY
  if (sendgridKey) {
    try {
      const sgMail = (await import('@sendgrid/mail')).default
      sgMail.setApiKey(sendgridKey)

      // SendGrid MailDataRequired needs at least html or text; we cast after
      // ensuring at least one body field is present.
      const messageBody = config.html
        ? { html: config.html, ...(config.text && { text: config.text }) }
        : { text: config.text ?? '(no content)' }

      const message = {
        to: recipients.length === 1 ? recipients[0] : recipients,
        from: fromEmail,
        subject: config.subject,
        ...(config.replyTo && { replyTo: config.replyTo }),
        ...messageBody,
      } as Parameters<typeof sgMail.send>[0]

      const [sgResponse] = await sgMail.send(message)

      const result: EmailResult = {
        success: true,
        provider: 'sendgrid',
        messageId: sgResponse?.headers?.['x-message-id'] as string | undefined,
      }
      await logEmail(config, result)
      return result
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error('[EmailService] SendGrid error:', err)

      const result: EmailResult = {
        success: false,
        provider: 'sendgrid',
        error: errMsg,
      }
      await logEmail(config, result)
      // Fall through to log-only so the caller always gets a result
    }
  }

  // ------- Priority 3: Log only (dev / no provider configured) -------
  console.warn('[EmailService] LOG-ONLY mode — email not delivered:', {
    to: recipients,
    from: fromEmail,
    subject: config.subject,
    template: config.template ?? '(inline HTML)',
    templateData: config.templateData,
    htmlLength: config.html?.length ?? 0,
  })

  const result: EmailResult = { success: true, provider: 'logged' }
  await logEmail(config, result)
  return result
}

// ---------------------------------------------------------------------------
// Inline HTML helpers (will be replaced by email-templates.ts in next step)
// ---------------------------------------------------------------------------

function baseHtml(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
                ÚčetníOS
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                ÚčetníOS · Automatická zpráva — neodpovídejte na tento email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${href}"
       style="display:inline-block;background:#1a56db;color:#ffffff;text-decoration:none;
              padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
      ${label}
    </a>
  </p>`
}

// ---------------------------------------------------------------------------
// Convenience functions
// ---------------------------------------------------------------------------

/** Odeslání ověřovacího emailu po registraci. */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyUrl: string
): Promise<EmailResult> {
  const bodyContent = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Ověřte svůj účet</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Dobrý den, <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Děkujeme za registraci v ÚčetníOS. Pro dokončení registrace prosím ověřte svůj
      e-mailový účet kliknutím na tlačítko níže.
    </p>
    ${ctaButton(verifyUrl, 'Ověřit účet')}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
      Odkaz je platný 24 hodin. Pokud jste o registraci nežádali, tento email ignorujte.
    </p>`

  return sendEmail({
    to: email,
    subject: 'Ověřte svůj účet — ÚčetníOS',
    html: baseHtml('Ověření účtu', bodyContent),
    text: `Dobrý den, ${name},\n\nPro ověření účtu klikněte na tento odkaz:\n${verifyUrl}\n\nOdkaz platí 24 hodin.\n\n— ÚčetníOS`,
  })
}

/** Odeslání emailu s odkazem pro obnovu hesla. */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<EmailResult> {
  const bodyContent = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Obnovení hesla</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Dobrý den, <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Obdrželi jsme žádost o obnovení hesla k vašemu účtu. Klikněte na tlačítko níže
      a nastavte si nové heslo.
    </p>
    ${ctaButton(resetUrl, 'Obnovit heslo')}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
      Odkaz je platný 1 hodinu. Pokud jste o obnovení hesla nežádali, ignorujte tento email
      — váš účet zůstane nezměněn.
    </p>`

  return sendEmail({
    to: email,
    subject: 'Obnovení hesla — ÚčetníOS',
    html: baseHtml('Obnovení hesla', bodyContent),
    text: `Dobrý den, ${name},\n\nPro obnovení hesla klikněte na:\n${resetUrl}\n\nOdkaz platí 1 hodinu.\n\n— ÚčetníOS`,
  })
}

/** Uvítací email po úspěšné registraci / ověření. */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<EmailResult> {
  const bodyContent = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">Vítejte v ÚčetníOS!</h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Dobrý den, <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Váš účet byl úspěšně ověřen. Nyní máte přístup ke všem funkcím ÚčetníOS —
      správě klientů, vytěžování dokladů, přehledům DPH i dalším nástrojům moderního
      účetnictví.
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Jako nový uživatel máte aktivovanou <strong>30denní zkušební verzi Professional</strong>
      zdarma. Užijte si všechny prémiové funkce bez omezení.
    </p>
    ${ctaButton('https://app.zajcon.cz', 'Přejít do aplikace')}
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
      Máte otázky? Odpovídáme na <a href="mailto:podpora@zajcon.cz"
      style="color:#1a56db;">podpora@zajcon.cz</a>.
    </p>`

  return sendEmail({
    to: email,
    subject: 'Vítejte v ÚčetníOS!',
    html: baseHtml('Vítejte v ÚčetníOS', bodyContent),
    text: `Dobrý den, ${name},\n\nVáš účet v ÚčetníOS je aktivní. Máte 30denní zkušební verzi Professional zdarma.\n\nPřihlaste se na: https://app.zajcon.cz\n\n— ÚčetníOS`,
  })
}

/** Generický notifikační email — pro notification systém. */
export async function sendNotificationEmail(
  email: string,
  template: string,
  data: Record<string, string>
): Promise<EmailResult> {
  // If template maps to an Ecomail template ID stored in env/config, use it.
  // Convention: ECOMAIL_TEMPLATE_<TEMPLATE_NAME_UPPER> e.g. ECOMAIL_TEMPLATE_DEADLINE_REMINDER
  const envKey = `ECOMAIL_TEMPLATE_${template.toUpperCase().replace(/-/g, '_')}`
  const ecomailTemplateId = process.env[envKey]

  if (ecomailTemplateId) {
    return sendEmail({
      to: email,
      subject: data.subject ?? 'Oznámení z ÚčetníOS',
      template: ecomailTemplateId,
      templateData: data,
    })
  }

  // Fallback: simple inline HTML notification
  const rows = Object.entries(data)
    .filter(([key]) => key !== 'subject')
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding:6px 12px 6px 0;font-size:14px;color:#6b7280;white-space:nowrap;">${key}</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;">${value}</td>
        </tr>`
    )
    .join('')

  const bodyContent = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#111827;">${data.subject ?? 'Oznámení'}</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Obdrželi jste automatické oznámení ze systému ÚčetníOS.
    </p>
    ${
      rows
        ? `<table cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e5e7eb;">
             <tbody>${rows}</tbody>
           </table>`
        : ''
    }`

  return sendEmail({
    to: email,
    subject: data.subject ?? 'Oznámení z ÚčetníOS',
    html: baseHtml(data.subject ?? 'Oznámení', bodyContent),
    text: Object.entries(data)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n'),
  })
}
