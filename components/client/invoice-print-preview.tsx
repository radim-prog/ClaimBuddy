'use client'


interface RawInvoiceItem {
  id?: string
  description: string
  quantity: number
  unit?: string
  unit_price: number
  vat_rate: number
  total?: number
  total_without_vat?: number
  total_with_vat?: number
}

interface NormalizedItem {
  id?: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  total_without_vat: number
  total_with_vat: number
}

function normalizeItem(raw: RawInvoiceItem): NormalizedItem {
  const qty = Number(raw.quantity) || 0
  const price = Number(raw.unit_price) || 0
  const rate = Number(raw.vat_rate) || 0
  const base = raw.total_without_vat != null ? Number(raw.total_without_vat) : qty * price
  const withVat = raw.total_with_vat != null ? Number(raw.total_with_vat)
    : raw.total != null ? Number(raw.total)
    : base * (1 + rate / 100)
  return {
    id: raw.id,
    description: raw.description || '',
    quantity: qty,
    unit: raw.unit || 'ks',
    unit_price: price,
    vat_rate: rate,
    total_without_vat: base,
    total_with_vat: withVat,
  }
}

interface InvoiceData {
  id: string
  invoice_number: string
  variable_symbol?: string
  issue_date: string
  due_date?: string
  tax_date?: string
  partner?: { name: string; ico?: string; dic?: string; address?: string }
  partner_name?: string
  items?: RawInvoiceItem[]
  total_without_vat?: number
  total_vat?: number
  total_with_vat?: number
  amount?: number
  payment_method?: string
  constant_symbol?: string
  specific_symbol?: string
  notes?: string
  document_type?: string
}

interface SupplierData {
  name: string
  ico: string
  dic?: string
  address?: string | { street?: string; city?: string; zip?: string }
}

function formatAddress(addr: string | { street?: string; city?: string; zip?: string } | null | undefined): string {
  if (!addr) return ''
  if (typeof addr === 'string') return addr
  const parts = [addr.street, addr.city, addr.zip].filter(Boolean)
  return parts.join(', ')
}

function formatAmount(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '0,00'
  return amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('cs-CZ')
}

const docTypeLabels: Record<string, string> = {
  invoice: 'FAKTURA – DAŇOVÝ DOKLAD',
  proforma: 'ZÁLOHOVÁ FAKTURA',
  credit_note: 'DOBROPIS',
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Bankovní převod',
  cash: 'Hotově',
  card: 'Kartou',
}

// Hardcoded supplier payment info (same as invoice-config.ts)
const SUPPLIER_BANK = '2702078793/2010'
const SUPPLIER_IBAN = 'CZ8920100000002702078793'

function formatIBAN(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

export function InvoicePrintPreview({
  invoice,
  supplier,
  qrDataUrl,
}: {
  invoice: InvoiceData
  supplier?: SupplierData | null
  qrDataUrl?: string | null
}) {
  const docType = invoice.document_type || 'invoice'
  const rawItems = Array.isArray(invoice.items) ? invoice.items : []
  const items = rawItems.map(normalizeItem)
  const total = invoice.total_with_vat ?? invoice.amount ?? 0

  // VAT recap
  const vatRecap = new Map<number, { base: number; vat: number; total: number }>()
  for (const item of items) {
    const rate = item.vat_rate
    const existing = vatRecap.get(rate) || { base: 0, vat: 0, total: 0 }
    existing.base += item.total_without_vat
    existing.vat += item.total_with_vat - item.total_without_vat
    existing.total += item.total_with_vat
    vatRecap.set(rate, existing)
  }

  return (
    <div className="bg-white text-gray-900 shadow-lg print-preview" style={{ maxWidth: 794, fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-preview, .print-preview * { visibility: visible; }
          .print-preview { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-violet-600 pb-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-violet-600">{docTypeLabels[docType] || 'FAKTURA'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Vystaveno v systému Pojistná Pomoc</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-700">{invoice.invoice_number}</p>
            {invoice.variable_symbol && (
              <p className="text-xs text-gray-500">VS: {invoice.variable_symbol}</p>
            )}
          </div>
        </div>

        {/* Supplier + Customer */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div className="bg-gray-50 rounded p-3">
            <p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Dodavatel</p>
            <p className="text-sm font-bold">{supplier?.name || 'Zajcon Consulting s.r.o.'}</p>
            {(supplier?.ico || true) && <p className="text-xs text-gray-600">IČO: {supplier?.ico || '09426132'}</p>}
            {(supplier?.dic || true) && <p className="text-xs text-gray-600">DIČ: {supplier?.dic || 'CZ09426132'}</p>}
            {supplier?.address && <p className="text-xs text-gray-600">{formatAddress(supplier.address)}</p>}
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="text-[10px] font-bold text-violet-600 uppercase mb-1">Odběratel</p>
            <p className="text-sm font-bold">{invoice.partner?.name || invoice.partner_name || 'Neuvedeno'}</p>
            {invoice.partner?.ico && <p className="text-xs text-gray-600">IČO: {invoice.partner.ico}</p>}
            {invoice.partner?.dic && <p className="text-xs text-gray-600">DIČ: {invoice.partner.dic}</p>}
            {invoice.partner?.address && <p className="text-xs text-gray-600">{formatAddress(invoice.partner.address as any)}</p>}
          </div>
        </div>

        {/* Dates row */}
        <div className="flex bg-violet-50 rounded p-2.5 mb-5">
          <div className="flex-1 text-center">
            <p className="text-[9px] text-gray-500 uppercase">Datum vystavení</p>
            <p className="text-sm font-bold">{formatDate(invoice.issue_date)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[9px] text-gray-500 uppercase">Datum splatnosti</p>
            <p className="text-sm font-bold">{formatDate(invoice.due_date || '')}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[9px] text-gray-500 uppercase">DUZP</p>
            <p className="text-sm font-bold">{formatDate(invoice.tax_date || invoice.issue_date)}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[9px] text-gray-500 uppercase">Variabilní symbol</p>
            <p className="text-sm font-bold">{invoice.variable_symbol || '—'}</p>
          </div>
        </div>

        {/* Items table */}
        {items.length > 0 && (
          <div className="mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-violet-600 text-white">
                  <th className="px-2 py-1.5 text-left rounded-l w-8">#</th>
                  <th className="px-2 py-1.5 text-left">Popis</th>
                  <th className="px-2 py-1.5 text-right w-12">Mn.</th>
                  <th className="px-2 py-1.5 text-center w-10">Jed.</th>
                  <th className="px-2 py-1.5 text-right w-20">Cena/jed.</th>
                  <th className="px-2 py-1.5 text-right w-12">DPH</th>
                  <th className="px-2 py-1.5 text-right rounded-r w-24">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id || i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="px-2 py-1.5 border-b border-gray-100">{i + 1}</td>
                    <td className="px-2 py-1.5 border-b border-gray-100">{item.description}</td>
                    <td className="px-2 py-1.5 text-right border-b border-gray-100">{item.quantity}</td>
                    <td className="px-2 py-1.5 text-center border-b border-gray-100">{item.unit || 'ks'}</td>
                    <td className="px-2 py-1.5 text-right border-b border-gray-100">{formatAmount(item.unit_price)}</td>
                    <td className="px-2 py-1.5 text-right border-b border-gray-100">{item.vat_rate}%</td>
                    <td className="px-2 py-1.5 text-right border-b border-gray-100 font-medium">{formatAmount(item.total_with_vat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-5">
          <div className="w-64">
            {Array.from(vatRecap.entries()).map(([rate, data]) => (
              <div key={rate} className="flex justify-between py-0.5 px-2 text-xs">
                <span className="text-gray-600">Základ DPH {rate}%</span>
                <span className="font-medium">{formatAmount(data.base)} Kč</span>
              </div>
            ))}
            {Array.from(vatRecap.entries()).map(([rate, data]) => (
              <div key={`vat-${rate}`} className="flex justify-between py-0.5 px-2 text-xs">
                <span className="text-gray-600">DPH {rate}%</span>
                <span className="font-medium">{formatAmount(data.vat)} Kč</span>
              </div>
            ))}
            {invoice.total_without_vat != null && (
              <div className="flex justify-between py-0.5 px-2 text-xs">
                <span className="text-gray-600">Celkem bez DPH</span>
                <span className="font-medium">{formatAmount(invoice.total_without_vat)} Kč</span>
              </div>
            )}
            {invoice.total_vat != null && (
              <div className="flex justify-between py-0.5 px-2 text-xs">
                <span className="text-gray-600">DPH celkem</span>
                <span className="font-medium">{formatAmount(invoice.total_vat)} Kč</span>
              </div>
            )}
            <div className="flex justify-between py-2 px-3 bg-violet-600 text-white rounded mt-1">
              <span className="font-bold text-sm">CELKEM K ÚHRADĚ</span>
              <span className="font-bold text-sm">{formatAmount(total)} Kč</span>
            </div>
          </div>
        </div>

        {/* Payment info + QR */}
        <div className="flex gap-5 border-t border-gray-200 pt-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-600 mb-2">Platební údaje</p>
            <div className="text-xs space-y-1">
              <div>
                <span className="text-gray-500">Číslo účtu: </span>
                <span className="font-bold">{SUPPLIER_BANK}</span>
              </div>
              <div>
                <span className="text-gray-500">IBAN: </span>
                <span className="font-bold">{formatIBAN(SUPPLIER_IBAN)}</span>
              </div>
              <div>
                <span className="text-gray-500">Variabilní symbol: </span>
                <span className="font-bold">{invoice.variable_symbol || '—'}</span>
              </div>
              {invoice.constant_symbol && (
                <div>
                  <span className="text-gray-500">Konstantní symbol: </span>
                  <span className="font-bold">{invoice.constant_symbol}</span>
                </div>
              )}
              {invoice.specific_symbol && (
                <div>
                  <span className="text-gray-500">Specifický symbol: </span>
                  <span className="font-bold">{invoice.specific_symbol}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Způsob platby: </span>
                <span className="font-bold">{paymentMethodLabels[invoice.payment_method || ''] || 'Bankovní převod'}</span>
              </div>
              <div>
                <span className="text-gray-500">Částka k úhradě: </span>
                <span className="font-bold">{formatAmount(total)} Kč</span>
              </div>
            </div>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="QR Platba" className="w-28 h-28" />
              <p className="text-[9px] text-gray-500 mt-1">QR Platba (SPAYD)</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Poznámka:</p>
            <p className="text-xs text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-3 border-t border-gray-200 text-center">
          <p className="text-[9px] text-gray-400">
            {supplier?.name || 'Zajcon Consulting s.r.o.'} | IČO: {supplier?.ico || '09426132'} | Vystaveno v systému Pojistná Pomoc
          </p>
        </div>
      </div>
    </div>
  )
}
