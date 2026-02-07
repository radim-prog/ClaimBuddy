// DPH (VAT) tracking types

export type VatReturnType = 'dph' | 'kontrolni_hlaseni' | 'souhrnne_hlaseni'
export type VatReturnStatus = 'not_filed' | 'filed' | 'paid'

export type VatReturn = {
  id: string
  company_id: string
  period: string // YYYY-MM
  type: VatReturnType
  status: VatReturnStatus
  filed_date: string | null
  amount: number | null // positive = to pay, negative = refund
  paid_date: string | null
  notes: string | null
}

export type VatSummary = {
  company_id: string
  period: string
  vat_to_pay: number
  vat_to_refund: number
  dph_status: VatReturnStatus
  kontrolni_status: VatReturnStatus
  souhrnne_status: VatReturnStatus | null // null if not applicable
}

export function getVatReturnTypeLabel(type: VatReturnType): string {
  const labels: Record<VatReturnType, string> = {
    dph: 'Přiznání DPH',
    kontrolni_hlaseni: 'Kontrolní hlášení',
    souhrnne_hlaseni: 'Souhrnné hlášení',
  }
  return labels[type]
}

export function getVatStatusLabel(status: VatReturnStatus): string {
  const labels: Record<VatReturnStatus, string> = {
    not_filed: 'Nepodáno',
    filed: 'Podáno',
    paid: 'Zaplaceno',
  }
  return labels[status]
}

export function getVatStatusColor(status: VatReturnStatus): { bg: string; text: string } {
  const colors: Record<VatReturnStatus, { bg: string; text: string }> = {
    not_filed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
    filed: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
    paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  }
  return colors[status]
}
