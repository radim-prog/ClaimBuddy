/**
 * Předávací protokol — handover protocol template for transferring
 * accounting documents, data, and responsibilities.
 */

export interface HandoverItem {
  name: string
  quantity?: string
  note?: string
}

export interface PredavaciProtokolData {
  // Protocol
  protocol_number: string
  handover_date: string  // YYYY-MM-DD

  // From (who is handing over)
  from_name: string
  from_role?: string  // e.g. "účetní", "jednatel"

  // To (who is receiving)
  to_name: string
  to_role?: string

  // Company
  company_name: string
  company_ico: string

  // Items
  items: HandoverItem[]

  // Optional
  reason?: string
  notes?: string
}

const REASON_LABELS: Record<string, string> = {
  year_end: 'Roční uzávěrka',
  accountant_change: 'Změna účetní',
  termination: 'Ukončení spolupráce',
}

export function generatePredavaciProtokol(d: PredavaciProtokolData): string {
  const formattedDate = new Date(d.handover_date).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const reasonText = d.reason
    ? REASON_LABELS[d.reason] || d.reason
    : ''

  let text = `PŘEDÁVACÍ PROTOKOL č. ${d.protocol_number}


Datum: ${formattedDate}
Firma: ${d.company_name} (IČ: ${d.company_ico})
${reasonText ? `Důvod: ${reasonText}\n` : ''}

PŘEDÁVAJÍCÍ:
   ${d.from_name}${d.from_role ? ` (${d.from_role})` : ''}

PŘEBÍRAJÍCÍ:
   ${d.to_name}${d.to_role ? ` (${d.to_role})` : ''}


SEZNAM PŘEDÁVANÝCH DOKUMENTŮ A DAT:

`

  if (d.items.length === 0) {
    text += '   (žádné položky)\n'
  } else {
    d.items.forEach((item, i) => {
      text += `   ${i + 1}. ${item.name}`
      if (item.quantity) text += ` — ${item.quantity}`
      if (item.note) text += ` (${item.note})`
      text += '\n'
    })
  }

  if (d.notes) {
    text += `\n\nPOZNÁMKY:\n   ${d.notes}\n`
  }

  text += `


PODPISY:

Předávající: ________________________     Přebírající: ________________________
             ${d.from_name}                              ${d.to_name}

Datum: ${formattedDate}
`

  return text
}

/**
 * Default items commonly transferred during accountant change.
 */
export const DEFAULT_HANDOVER_ITEMS: HandoverItem[] = [
  { name: 'Účetní deník (hlavní kniha)' },
  { name: 'Přijaté faktury' },
  { name: 'Vydané faktury' },
  { name: 'Bankovní výpisy' },
  { name: 'Pokladní doklady' },
  { name: 'Mzdová agenda' },
  { name: 'Přiznání k DPH' },
  { name: 'Přiznání k dani z příjmu' },
  { name: 'Přístupové údaje (datová schránka, portály)' },
  { name: 'Smlouvy a smluvní dokumentace' },
]
