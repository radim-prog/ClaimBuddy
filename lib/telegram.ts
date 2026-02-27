/**
 * Telegram Bot API client for sending notifications
 * Uses TELEGRAM_BOT_TOKEN from environment
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'MarkdownV2' = 'HTML'
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[Telegram] BOT_TOKEN not configured')
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      console.error('[Telegram] Send failed:', data.description)
      return { ok: false, error: data.description }
    }

    return { ok: true, messageId: data.result?.message_id }
  } catch (error) {
    console.error('[Telegram] Network error:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

// Notification templates
export function formatTaxImpactNotification(
  companyName: string,
  unmatchedCount: number,
  taxImpact: number,
  vatImpact: number
): string {
  const total = taxImpact + vatImpact
  return [
    `<b>Chybějící doklady — ${companyName}</b>`,
    '',
    `Máte <b>${unmatchedCount}</b> nespárovaných výdajů.`,
    '',
    `Dopad na dani z příjmu: <b>${taxImpact.toLocaleString('cs-CZ')} Kč</b>`,
    vatImpact > 0 ? `Ztráta odpočtu DPH: <b>${vatImpact.toLocaleString('cs-CZ')} Kč</b>` : null,
    `<b>Celkový dopad: ${total.toLocaleString('cs-CZ')} Kč</b>`,
    '',
    'Nahrajte chybějící doklady v aplikaci.',
  ].filter(Boolean).join('\n')
}

export function formatInvoiceDueNotification(
  invoiceNumber: string,
  amount: number,
  dueDate: string,
  daysLeft: number
): string {
  return [
    `<b>Blíží se splatnost faktury</b>`,
    '',
    `Faktura: <b>${invoiceNumber}</b>`,
    `Částka: <b>${amount.toLocaleString('cs-CZ')} Kč</b>`,
    `Splatnost: <b>${new Date(dueDate).toLocaleDateString('cs-CZ')}</b>`,
    daysLeft > 0 ? `Zbývá: ${daysLeft} dní` : '<b>Po splatnosti!</b>',
  ].join('\n')
}

export function formatMonthlySummaryNotification(
  companyName: string,
  period: string,
  income: number,
  expense: number,
  taxImpact: number
): string {
  return [
    `<b>Měsíční přehled — ${companyName}</b>`,
    `Období: ${period}`,
    '',
    `Příjmy: <b>${income.toLocaleString('cs-CZ')} Kč</b>`,
    `Výdaje: <b>${expense.toLocaleString('cs-CZ')} Kč</b>`,
    taxImpact > 0 ? `\nDaňový dopad nespárovaných: <b>${taxImpact.toLocaleString('cs-CZ')} Kč</b>` : '',
  ].filter(Boolean).join('\n')
}

export function isTelegramAvailable(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN
}
