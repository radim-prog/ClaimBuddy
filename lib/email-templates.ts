/**
 * Email templates for ÚčetníOS
 * All templates use inline CSS (email client compatibility).
 * All text is in Czech, formal "vykání" tone.
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a number as Czech currency string, e.g. 12500 → "12 500 Kč"
 */
function formatAmount(amount: number): string {
  return (
    amount
      .toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      .replace(/\s/g, '\u00a0') + // non-breaking space
    ' Kč'
  )
}

/**
 * Renders a CTA button with inline CSS.
 * Default colour: #2563eb (blue-600).
 */
export function emailButton(text: string, url: string, color = '#2563eb'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color};">
          <a href="${url}" target="_blank"
             style="display: inline-block; padding: 12px 24px; font-family: Arial, sans-serif;
                    font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none;
                    border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`
}

/**
 * Wraps content in a full responsive email layout.
 * Uses inline CSS only — no external stylesheets.
 */
export function wrapInLayout(
  title: string,
  content: string,
  options?: { showUnsubscribe?: boolean }
): string {
  const unsubscribeBlock = options?.showUnsubscribe
    ? `<p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
         <a href="https://app.zajcon.cz/unsubscribe" style="color: #9ca3af;">
           Odhlásit se z emailů
         </a>
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color: #f3f4f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 16px; text-align: center;">
              <span style="font-family: Arial, sans-serif; font-size: 24px; font-weight: 700;
                           color: #2563eb; letter-spacing: -0.5px;">
                ÚčetníOS
              </span>
            </td>
          </tr>

          <!-- Content card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 8px;
                       padding: 32px 24px; color: #111827;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 20px; text-align: center;
                       font-family: Arial, sans-serif; font-size: 12px; color: #6b7280;">
              <p style="margin: 0;">
                Tento email byl odeslán z ÚčetníOS •
                <a href="https://ucetnios.cz" style="color: #6b7280;">ucetnios.cz</a>
              </p>
              ${unsubscribeBlock}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function registrationVerification(name: string, verifyUrl: string): EmailTemplate {
  const subject = 'Ověřte svůj email — ÚčetníOS'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      děkujeme za registraci v ÚčetníOS. Pro dokončení registrace prosím ověřte svou emailovou adresu kliknutím na tlačítko níže.
    </p>
    ${emailButton('Ověřit email', verifyUrl)}
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      Odkaz je platný po dobu <strong>24 hodin</strong>. Pokud jste registraci neprovedli, tento email ignorujte.
    </p>`

  const text = `Dobrý den, ${name},

děkujeme za registraci v ÚčetníOS. Pro dokončení registrace prosím ověřte svou emailovou adresu na tomto odkazu:

${verifyUrl}

Odkaz je platný po dobu 24 hodin. Pokud jste registraci neprovedli, tento email ignorujte.

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function welcomeEmail(name: string, loginUrl: string): EmailTemplate {
  const subject = 'Vítejte v ÚčetníOS!'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      váš účet v ÚčetníOS je aktivní. Jsme rádi, že vás máme na palubě.
    </p>
    <p style="margin: 0 0 8px; font-size: 15px; color: #374151;">S ÚčetníOS můžete:</p>
    <ul style="margin: 0 0 20px; padding-left: 20px; color: #374151; font-size: 15px; line-height: 1.8;">
      <li>Nahrávat a spravovat doklady s pomocí AI</li>
      <li>Sledovat DPH, daně a termíny v přehledném dashboardu</li>
      <li>Komunikovat s účetním přímo v aplikaci</li>
      <li>Exportovat data pro Pohodu a další systémy</li>
    </ul>
    ${emailButton('Přihlásit se', loginUrl)}`

  const text = `Dobrý den, ${name},

váš účet v ÚčetníOS je aktivní. Jsme rádi, že vás máme na palubě.

S ÚčetníOS můžete:
- Nahrávat a spravovat doklady s pomocí AI
- Sledovat DPH, daně a termíny v přehledném dashboardu
- Komunikovat s účetním přímo v aplikaci
- Exportovat data pro Pohodu a další systémy

Přihlásit se: ${loginUrl}

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function passwordReset(name: string, resetUrl: string, expiresIn: string): EmailTemplate {
  const subject = 'Obnovení hesla — ÚčetníOS'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      obdrželi jsme žádost o obnovení hesla k vašemu účtu. Kliknutím na tlačítko níže nastavíte nové heslo.
    </p>
    ${emailButton('Nastavit nové heslo', resetUrl)}
    <p style="margin: 0 0 12px; font-size: 13px; color: #6b7280;">
      Odkaz je platný <strong>${expiresIn}</strong>.
    </p>
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      Pokud jste o obnovení hesla nežádali, tento email ignorujte — váš účet zůstává v bezpečí.
    </p>`

  const text = `Dobrý den, ${name},

obdrželi jsme žádost o obnovení hesla k vašemu účtu. Pro nastavení nového hesla použijte tento odkaz:

${resetUrl}

Odkaz je platný ${expiresIn}. Pokud jste o obnovení hesla nežádali, tento email ignorujte.

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Komunikace
// ---------------------------------------------------------------------------

export function newMessageNotification(
  name: string,
  senderName: string,
  messagePreview: string
): EmailTemplate {
  const subject = `Nová zpráva od ${senderName} — ÚčetníOS`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      máte novou zprávu od <strong>${senderName}</strong> v ÚčetníOS.
    </p>
    <div style="background-color: #f9fafb; border-left: 3px solid #2563eb;
                padding: 12px 16px; margin: 0 0 20px; border-radius: 0 4px 4px 0;">
      <p style="margin: 0; font-size: 14px; color: #374151; font-style: italic; line-height: 1.6;">
        „${messagePreview}"
      </p>
    </div>
    ${emailButton('Zobrazit zprávu', 'https://app.zajcon.cz/komunikace')}`

  const text = `Dobrý den, ${name},

máte novou zprávu od ${senderName} v ÚčetníOS.

„${messagePreview}"

Zprávu zobrazíte zde: https://app.zajcon.cz/komunikace

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function newDocumentInInbox(
  name: string,
  companyName: string,
  attachmentCount: number
): EmailTemplate {
  const countLabel =
    attachmentCount === 1
      ? '1 příloha'
      : attachmentCount >= 2 && attachmentCount <= 4
      ? `${attachmentCount} přílohy`
      : `${attachmentCount} příloh`

  const subject = `Nový doklad v inboxu (${countLabel}) — ÚčetníOS`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      klient <strong>${companyName}</strong> nahrál do inboxu ${countLabel} k zpracování.
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151;">
      Doklady jsou připraveny k vytěžení a zaúčtování.
    </p>
    ${emailButton('Otevřít inbox', 'https://app.zajcon.cz/inbox')}`

  const text = `Dobrý den, ${name},

klient ${companyName} nahrál do inboxu ${countLabel} k zpracování.
Doklady jsou připraveny k vytěžení a zaúčtování.

Inbox: https://app.zajcon.cz/inbox

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Platby
// ---------------------------------------------------------------------------

export function paymentReminder(
  level: 1 | 2 | 3,
  name: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
): EmailTemplate {
  const subjectMap: Record<1 | 2 | 3, string> = {
    1: `Připomínka platby — faktura ${invoiceNumber}`,
    2: `Druhá upomínka — faktura ${invoiceNumber}`,
    3: `POSLEDNÍ UPOMÍNKA — faktura ${invoiceNumber}`,
  }
  const subject = subjectMap[level]

  const amountFormatted = formatAmount(amount)
  const accentColor = level === 3 ? '#dc2626' : level === 2 ? '#d97706' : '#2563eb'

  const urgencyText: Record<1 | 2 | 3, string> = {
    1: 'Dovolujeme si vás laskavě upozornit, že níže uvedená faktura dosud nebyla uhrazena.',
    2: 'Zasíláme vám druhou upomínku k úhradě níže uvedené faktury. Prosíme o neprodlené vyrovnání.',
    3: 'Toto je poslední výzva k úhradě faktury před předáním pohledávky k dalšímu řešení.',
  }

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      ${urgencyText[level]}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background-color: #f9fafb; border-radius: 6px; padding: 16px;
                  margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 50%;">Číslo faktury:</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Částka:</td>
        <td style="padding: 6px 0; font-size: 14px; color: ${accentColor}; font-weight: 700;">${amountFormatted}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Splatnost:</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${dueDate}</td>
      </tr>
    </table>
    ${emailButton('Zobrazit fakturu', 'https://app.zajcon.cz/faktury', accentColor)}
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      Pokud jste platbu již odeslali, tento email ignorujte. Děkujeme.
    </p>`

  const text = `Dobrý den, ${name},

${urgencyText[level]}

Číslo faktury: ${invoiceNumber}
Částka: ${amountFormatted}
Splatnost: ${dueDate}

Fakturu zobrazíte zde: https://app.zajcon.cz/faktury

Pokud jste platbu již odeslali, tento email ignorujte. Děkujeme.

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function paymentConfirmation(
  name: string,
  invoiceNumber: string,
  amount: number
): EmailTemplate {
  const subject = `Platba přijata — ${invoiceNumber}`
  const amountFormatted = formatAmount(amount)

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      evidujeme úhradu faktury <strong>${invoiceNumber}</strong> ve výši <strong>${amountFormatted}</strong>.
      Děkujeme za včasnou platbu.
    </p>
    <div style="display: flex; align-items: center; background-color: #f0fdf4;
                border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
      <span style="font-size: 20px; margin-right: 10px;">✓</span>
      <span style="font-size: 15px; color: #166534; font-weight: 600;">Faktura ${invoiceNumber} byla uhrazena</span>
    </div>
    ${emailButton('Zobrazit přehled faktur', 'https://app.zajcon.cz/faktury')}`

  const text = `Dobrý den, ${name},

evidujeme úhradu faktury ${invoiceNumber} ve výši ${amountFormatted}.
Děkujeme za včasnou platbu.

Přehled faktur: https://app.zajcon.cz/faktury

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function invoiceIssued(
  name: string,
  invoiceNumber: string,
  amount: number,
  dueDate: string
): EmailTemplate {
  const amountFormatted = formatAmount(amount)
  const subject = `Nová faktura ${invoiceNumber} — ${amountFormatted}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      byla vám vystavena nová faktura. Detaily platby naleznete níže.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background-color: #f9fafb; border-radius: 6px; padding: 16px;
                  margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 50%;">Číslo faktury:</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 600;">${invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Částka k úhradě:</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827; font-weight: 700;">${amountFormatted}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Datum splatnosti:</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${dueDate}</td>
      </tr>
    </table>
    ${emailButton('Zobrazit fakturu', 'https://app.zajcon.cz/faktury')}`

  const text = `Dobrý den, ${name},

byla vám vystavena nová faktura.

Číslo faktury: ${invoiceNumber}
Částka k úhradě: ${amountFormatted}
Datum splatnosti: ${dueDate}

Fakturu zobrazíte zde: https://app.zajcon.cz/faktury

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Termíny
// ---------------------------------------------------------------------------

export function deadlineApproaching(
  name: string,
  deadlineType: string,
  dueDate: string,
  companyName: string
): EmailTemplate {
  const subject = `Blíží se termín: ${deadlineType} — ${companyName}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      upozorňujeme vás, že se blíží důležitý termín pro firmu <strong>${companyName}</strong>.
    </p>
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
                padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px; font-size: 13px; color: #92400e; text-transform: uppercase;
                font-weight: 700; letter-spacing: 0.05em;">Termín</p>
      <p style="margin: 0 0 4px; font-size: 17px; color: #78350f; font-weight: 700;">${deadlineType}</p>
      <p style="margin: 0; font-size: 14px; color: #92400e;">do <strong>${dueDate}</strong></p>
    </div>
    ${emailButton('Zobrazit termíny', 'https://app.zajcon.cz/ukoly', '#d97706')}`

  const text = `Dobrý den, ${name},

upozorňujeme vás, že se blíží důležitý termín pro firmu ${companyName}.

${deadlineType} — do ${dueDate}

Termíny zobrazíte zde: https://app.zajcon.cz/ukoly

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export function marketplaceResponse(
  name: string,
  accountantName: string,
  accepted: boolean
): EmailTemplate {
  const subject = accepted
    ? `Účetní ${accountantName} přijala vaši žádost`
    : 'Odpověď na vaši žádost o účetní služby'

  const statusBlock = accepted
    ? `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;
                   padding: 16px; margin-bottom: 20px;">
         <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 600;">
           ✓ Vaše žádost byla přijata
         </p>
       </div>
       <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
         <strong>${accountantName}</strong> přijala vaši žádost o spolupráci. Nyní ji můžete kontaktovat přímo v ÚčetníOS.
       </p>
       ${emailButton('Otevřít komunikaci', 'https://app.zajcon.cz/komunikace')}`
    : `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;
                   padding: 16px; margin-bottom: 20px;">
         <p style="margin: 0; font-size: 15px; color: #991b1b; font-weight: 600;">
           Vaše žádost byla zamítnuta
         </p>
       </div>
       <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
         Bohužel <strong>${accountantName}</strong> v tuto chvíli nemůže přijmout nové klienty.
         V marketplace najdete další dostupné účetní.
       </p>
       ${emailButton('Najít jiného účetního', 'https://app.zajcon.cz/marketplace')}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    ${statusBlock}`

  const textBody = accepted
    ? `${accountantName} přijala vaši žádost o spolupráci. Nyní ji můžete kontaktovat přímo v ÚčetníOS: https://app.zajcon.cz/komunikace`
    : `Bohužel ${accountantName} v tuto chvíli nemůže přijmout nové klienty. V marketplace najdete další dostupné účetní: https://app.zajcon.cz/marketplace`

  const text = `Dobrý den, ${name},

${textBody}

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export function trialEnding(name: string, daysLeft: number, planName: string): EmailTemplate {
  const daysLabel = daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'
  const subject = `Zkušební období končí za ${daysLeft} ${daysLabel}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      váše zkušební období plánu <strong>${planName}</strong> skončí za <strong>${daysLeft} ${daysLabel}</strong>.
    </p>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Aby nedošlo k přerušení přístupu, aktivujte prosím předplatné. Všechna vaše data a nastavení zůstanou zachována.
    </p>
    ${emailButton('Vybrat předplatné', 'https://app.zajcon.cz/pricing', '#7c3aed')}
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      Po uplynutí zkušebního období bude váš účet přesunut na bezplatný plán Free.
    </p>`

  const text = `Dobrý den, ${name},

váše zkušební období plánu ${planName} skončí za ${daysLeft} ${daysLabel}.

Aby nedošlo k přerušení přístupu, aktivujte prosím předplatné na: https://app.zajcon.cz/pricing

Po uplynutí zkušebního období bude váš účet přesunut na bezplatný plán Free.

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function subscriptionChanged(
  name: string,
  action: 'renewed' | 'cancelled' | 'upgraded' | 'downgraded',
  planName: string
): EmailTemplate {
  const config: Record<
    typeof action,
    { subject: string; headline: string; body: string; color: string; icon: string }
  > = {
    renewed: {
      subject: `Předplatné obnoveno — ${planName}`,
      headline: 'Předplatné bylo úspěšně obnoveno',
      body: `Vaše předplatné plánu <strong>${planName}</strong> bylo úspěšně obnoveno. Přístup ke všem funkcím pokračuje bez přerušení.`,
      color: '#166534',
      icon: '✓',
    },
    cancelled: {
      subject: `Předplatné zrušeno — ${planName}`,
      headline: 'Předplatné bylo zrušeno',
      body: `Vaše předplatné plánu <strong>${planName}</strong> bylo zrušeno. Přístup k placeným funkcím bude aktivní do konce aktuálního zúčtovacího období.`,
      color: '#991b1b',
      icon: '✕',
    },
    upgraded: {
      subject: `Předplatné upgradováno — ${planName}`,
      headline: `Přechod na plán ${planName}`,
      body: `Vaše předplatné bylo úspěšně upgradováno na plán <strong>${planName}</strong>. Nové funkce jsou k dispozici okamžitě.`,
      color: '#1d4ed8',
      icon: '↑',
    },
    downgraded: {
      subject: `Předplatné downgradováno — ${planName}`,
      headline: `Přechod na plán ${planName}`,
      body: `Vaše předplatné bylo změněno na plán <strong>${planName}</strong>. Změna vstoupí v platnost na začátku dalšího zúčtovacího období.`,
      color: '#92400e',
      icon: '↓',
    },
  }

  const { subject, headline, body, color, icon } = config[action]

  const bgColor =
    action === 'renewed'
      ? '#f0fdf4'
      : action === 'cancelled'
      ? '#fef2f2'
      : action === 'upgraded'
      ? '#eff6ff'
      : '#fffbeb'

  const borderColor =
    action === 'renewed'
      ? '#bbf7d0'
      : action === 'cancelled'
      ? '#fecaca'
      : action === 'upgraded'
      ? '#bfdbfe'
      : '#fde68a'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <div style="background-color: ${bgColor}; border: 1px solid ${borderColor};
                border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 15px; color: ${color}; font-weight: 600;">
        ${icon} ${headline}
      </p>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      ${body}
    </p>
    ${emailButton('Správa předplatného', 'https://app.zajcon.cz/settings')}`

  const text = `Dobrý den, ${name},

${headline}

${body.replace(/<[^>]+>/g, '')}

Správa předplatného: https://app.zajcon.cz/settings

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Úkoly
// ---------------------------------------------------------------------------

export function taskAssigned(
  name: string,
  taskTitle: string,
  assignerName: string
): EmailTemplate {
  const subject = `Nový úkol: ${taskTitle}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      <strong>${assignerName}</strong> vám přidělil nový úkol v ÚčetníOS.
    </p>
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;
                padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase;
                font-weight: 700; letter-spacing: 0.05em;">Úkol</p>
      <p style="margin: 0; font-size: 16px; color: #111827; font-weight: 600;">${taskTitle}</p>
    </div>
    ${emailButton('Otevřít úkol', 'https://app.zajcon.cz/ukoly')}`

  const text = `Dobrý den, ${name},

${assignerName} vám přidělil nový úkol: ${taskTitle}

Úkol zobrazíte zde: https://app.zajcon.cz/ukoly

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

export function questionnaireToFill(
  name: string,
  questionnaireName: string,
  dueDate: string
): EmailTemplate {
  const subject = `Dotazník k vyplnění: ${questionnaireName}`

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      váš účetní vás žádá o vyplnění dotazníku <strong>${questionnaireName}</strong>.
      Vyplnění nám pomůže připravit vaše účetnictví správně a včas.
    </p>
    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;
                padding: 14px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #1d4ed8;">
        Prosíme o vyplnění do <strong>${dueDate}</strong>.
      </p>
    </div>
    ${emailButton('Vyplnit dotazník', 'https://app.zajcon.cz/dotazniky')}`

  const text = `Dobrý den, ${name},

váš účetní vás žádá o vyplnění dotazníku "${questionnaireName}".

Prosíme o vyplnění do ${dueDate}.

Dotazník vyplníte zde: https://app.zajcon.cz/dotazniky

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}

// ---------------------------------------------------------------------------
// Lead nurturing (clients without accountant)
// ---------------------------------------------------------------------------

export function leadDeadlineReminder(name: string): EmailTemplate {
  const subject = 'Blíží se daňové termíny — víte o nich?'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      jako podnikatel máte řadu daňových povinností s pevnými termíny. Přehlédnutí termínu může znamenat penále.
    </p>
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #92400e; font-weight: 700;">Nejčastější termíny:</p>
      <ul style="margin: 0; padding-left: 18px; color: #92400e; font-size: 14px; line-height: 1.8;">
        <li>DPH — 25. den následujícího měsíce</li>
        <li>Zálohy na daň z příjmu — 15.6. a 15.12.</li>
        <li>Přiznání k dani z příjmu — 1.4. (nebo 1.7. s daňovým poradcem)</li>
      </ul>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      S účetním v ÚčetníOS vám žádný termín neuteče — systém hlídá vše automaticky.
    </p>
    ${emailButton('Najít účetního', 'https://app.zajcon.cz/client/find-accountant')}
    `

  const text = `Dobrý den, ${name},

jako podnikatel máte řadu daňových povinností s pevnými termíny.

DPH — 25. den následujícího měsíce
Zálohy na daň z příjmu — 15.6. a 15.12.
Přiznání k dani — 1.4. (nebo 1.7. s daňovým poradcem)

S účetním v ÚčetníOS vám žádný termín neuteče.

Najít účetního: https://app.zajcon.cz/client/find-accountant

Odhlásit se z emailů: https://app.zajcon.cz/client/account

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

export function leadTipDocuments(name: string): EmailTemplate {
  const subject = '3 tipy jak si zjednodušit účetní doklady'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Správa dokladů nemusí být noční můra. Tady jsou 3 tipy od zkušených účetních:
    </p>
    <div style="margin-bottom: 20px;">
      <div style="border-left: 3px solid #2563eb; padding: 12px 16px; margin-bottom: 12px; background: #f9fafb; border-radius: 0 6px 6px 0;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #111827;">1. Foťte doklady hned</p>
        <p style="margin: 0; font-size: 14px; color: #374151;">Účtenku z oběda vyfoťte rovnou — za týden ji nenajdete.</p>
      </div>
      <div style="border-left: 3px solid #2563eb; padding: 12px 16px; margin-bottom: 12px; background: #f9fafb; border-radius: 0 6px 6px 0;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #111827;">2. Posílejte doklady emailem</p>
        <p style="margin: 0; font-size: 14px; color: #374151;">V ÚčetníOS máte sběrný email — přepošlete fakturu a je zařazena.</p>
      </div>
      <div style="border-left: 3px solid #2563eb; padding: 12px 16px; background: #f9fafb; border-radius: 0 6px 6px 0;">
        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #111827;">3. Nechte AI vytěžit data</p>
        <p style="margin: 0; font-size: 14px; color: #374151;">Naše AI přečte fakturu za vás — dodavatel, částka, DPH automaticky.</p>
      </div>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Chcete mít doklady v pořádku bez stresu? Propojte se s účetním.
    </p>
    ${emailButton('Najít účetního', 'https://app.zajcon.cz/client/find-accountant')}
    `

  const text = `Dobrý den, ${name},

3 tipy pro správu dokladů:
1. Foťte doklady hned — za týden je nenajdete
2. Posílejte doklady emailem — v ÚčetníOS máte sběrný email
3. Nechte AI vytěžit data — dodavatel, částka, DPH automaticky

Najít účetního: https://app.zajcon.cz/client/find-accountant

Odhlásit se: https://app.zajcon.cz/client/account

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

export function leadTaxSaving(name: string): EmailTemplate {
  const subject = 'Šetříte na daních? Účetní vám ušetří víc'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Věděli jste, že průměrný podnikatel přeplatí na daních <strong>15–25 %</strong> jen proto, že nemá
      správně nastavené odpočty a slevy?
    </p>
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #166534;">Co účetní optimalizuje:</p>
      <ul style="margin: 0; padding-left: 18px; color: #166534; font-size: 14px; line-height: 1.8;">
        <li>Správné uplatnění odpočtů (dary, penzijko, hypotéka)</li>
        <li>Optimální volba výdajového paušálu vs. skutečné výdaje</li>
        <li>Plánování záloh na daň z příjmu</li>
        <li>DPH optimalizace u plátců</li>
      </ul>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      V ÚčetníOS vidíte svůj <strong>daňový dopad v reálném čase</strong>. S účetním ušetříte ještě víc.
    </p>
    ${emailButton('Najít účetního', 'https://app.zajcon.cz/client/find-accountant')}
    `

  const text = `Dobrý den, ${name},

Průměrný podnikatel přeplatí na daních 15–25 % kvůli chybějícím odpočtům.

Účetní optimalizuje:
- Odpočty (dary, penzijko, hypotéka)
- Volbu paušálu vs. skutečné výdaje
- Plánování záloh
- DPH optimalizaci

Najít účetního: https://app.zajcon.cz/client/find-accountant

Odhlásit se: https://app.zajcon.cz/client/account

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

export function leadAccountantOffer(name: string): EmailTemplate {
  const subject = 'Nechte účetnictví na profíkovi — my najdeme toho správného'

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      Podnikáte, ale účetnictví řešíte sami? Nemusíte. V ÚčetníOS najdete ověřené
      účetní, kteří se postarají o vše — od dokladů po daňové přiznání.
    </p>
    <div style="margin-bottom: 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center; width: 33%;">
            <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1d4ed8;">✓</p>
            <p style="margin: 0; font-size: 13px; color: #1d4ed8; font-weight: 600;">Ověření účetní</p>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center; width: 33%;">
            <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1d4ed8;">💬</p>
            <p style="margin: 0; font-size: 13px; color: #1d4ed8; font-weight: 600;">Přímá komunikace</p>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 12px; background: #eff6ff; border-radius: 6px; text-align: center; width: 33%;">
            <p style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1d4ed8;">📊</p>
            <p style="margin: 0; font-size: 13px; color: #1d4ed8; font-weight: 600;">Online přehled</p>
          </td>
        </tr>
      </table>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Propojení je zdarma. Účetní vám připraví nabídku na míru.
    </p>
    ${emailButton('Najít účetního zdarma', 'https://app.zajcon.cz/client/find-accountant', '#16a34a')}
    `

  const text = `Dobrý den, ${name},

Podnikáte, ale účetnictví řešíte sami? V ÚčetníOS najdete ověřené účetní.

✓ Ověření účetní
💬 Přímá komunikace
📊 Online přehled

Propojení je zdarma.

Najít účetního: https://app.zajcon.cz/client/find-accountant

Odhlásit se: https://app.zajcon.cz/client/account

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content, { showUnsubscribe: true }), text }
}

/** All lead email generators indexed for rotation */
export const LEAD_EMAIL_VARIANTS = [
  leadDeadlineReminder,
  leadTipDocuments,
  leadTaxSaving,
  leadAccountantOffer,
] as const

// ---------------------------------------------------------------------------
// Účetní notifikace
// ---------------------------------------------------------------------------

export function clientDataDeleted(
  accountantName: string,
  clientName: string,
  deletedItems: string[]
): EmailTemplate {
  const subject = `Klient ${clientName} smazal data`

  const itemsList = deletedItems
    .map(
      (item) =>
        `<li style="padding: 4px 0; font-size: 14px; color: #374151;">${item}</li>`
    )
    .join('')

  const content = `
    <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Dobrý den, <strong>${accountantName}</strong>,</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #374151; line-height: 1.6;">
      klient <strong>${clientName}</strong> smazal následující data ve svém účtu:
    </p>
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;
                padding: 16px; margin-bottom: 20px;">
      <ul style="margin: 0; padding-left: 18px;">
        ${itemsList}
      </ul>
    </div>
    <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
      Pokud byla data smazána omylem nebo je potřebujete obnovit, kontaktujte klienta.
    </p>
    ${emailButton('Zobrazit profil klienta', 'https://app.zajcon.cz/klienti', '#dc2626')}`

  const itemsText = deletedItems.map((item) => `  - ${item}`).join('\n')

  const text = `Dobrý den, ${accountantName},

klient ${clientName} smazal následující data:

${itemsText}

Pokud byla data smazána omylem nebo je potřebujete obnovit, kontaktujte klienta.

Profil klienta: https://app.zajcon.cz/klienti

ÚčetníOS • ucetnios.cz`

  return { subject, html: wrapInLayout(subject, content), text }
}
