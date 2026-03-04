'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Send,
  CheckCheck,
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  CreditCard,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/lib/mock-data'
import type { SupplierInfo } from '@/lib/invoice-config'
import { PaymentQR } from '@/components/invoice/payment-qr'
import { SendInvoiceDialog } from '@/components/invoice/send-invoice-dialog'
import { toast } from 'sonner'

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof FileText }> = {
  draft: { label: 'Koncept', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: FileText },
  sent: { label: 'Odesláno', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Send },
  paid: { label: 'Zaplaceno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCheck },
  cancelled: { label: 'Storno', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('cs-CZ')
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/accountant/invoices/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.invoice) setInvoice(json.invoice)
        if (json?.supplier) setSupplier(json.supplier)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleMarkAsSent = async () => {
    if (!invoice) return
    try {
      const response = await fetch(`/api/accountant/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Failed')
      const { invoice: updated } = await response.json()
      setInvoice(updated)
      toast.success('Faktura označena jako odeslaná')
    } catch {
      toast.error('Chyba při aktualizaci')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!invoice) return
    try {
      const response = await fetch(`/api/accountant/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid', paid_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Failed')
      const { invoice: updated } = await response.json()
      setInvoice(updated)
      toast.success('Faktura označena jako zaplacená')
    } catch {
      toast.error('Chyba při aktualizaci')
    }
  }

  const handleDelete = async () => {
    if (!invoice) return
    if (!confirm('Opravdu chcete smazat tuto fakturu?')) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/accountant/invoices/${invoice.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed')
      toast.success('Faktura smazána')
      router.push('/accountant/invoices')
    } catch {
      toast.error('Chyba při mazání')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-purple-600 animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítání faktury...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Faktura nenalezena</h2>
        <Link href="/accountant/invoices">
          <Button variant="outline">Zpět na seznam</Button>
        </Link>
      </div>
    )
  }

  const config = statusConfig[invoice.status] || statusConfig.draft
  const StatusIcon = config.icon

  // VAT recap
  const vatRecap = new Map<number, { base: number; vat: number; total: number }>()
  for (const item of invoice.items) {
    const rate = item.vat_rate || 0
    const existing = vatRecap.get(rate) || { base: 0, vat: 0, total: 0 }
    existing.base += item.total_without_vat
    existing.vat += item.total_with_vat - item.total_without_vat
    existing.total += item.total_with_vat
    vatRecap.set(rate, existing)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/accountant/invoices">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět na seznam
          </Button>
        </Link>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {invoice.invoice_number}
                  </h1>
                  <Badge className={config.color}>
                    <StatusIcon className="h-3.5 w-3.5 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {invoice.customer?.name || invoice.company_name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(invoice.total_with_vat)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">celkem s DPH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Datum vystavení', value: formatDate(invoice.issue_date), icon: Calendar },
          { label: 'Datum splatnosti', value: formatDate(invoice.due_date), icon: Calendar },
          { label: 'DUZP', value: formatDate(invoice.tax_date), icon: Calendar },
          { label: 'Variabilní symbol', value: invoice.variable_symbol, icon: CreditCard },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 text-center">
              <item.icon className="h-4 w-4 mx-auto text-purple-500 mb-1" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase">{item.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier + Customer */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-600 dark:text-purple-400 uppercase flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Dodavatel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-gray-900 dark:text-white">{supplier?.name || '—'}</p>
            <p className="text-gray-600 dark:text-gray-400">IČO: {supplier?.ico}</p>
            <p className="text-gray-600 dark:text-gray-400">DIČ: {supplier?.dic}</p>
            <p className="text-gray-600 dark:text-gray-400">{supplier?.address}</p>
            <p className="text-gray-600 dark:text-gray-400">{supplier?.zip} {supplier?.city}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-600 dark:text-purple-400 uppercase flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Odběratel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-gray-900 dark:text-white">
              {invoice.customer?.name || invoice.company_name}
            </p>
            {invoice.customer?.ico && (
              <p className="text-gray-600 dark:text-gray-400">IČO: {invoice.customer.ico}</p>
            )}
            {invoice.customer?.dic && (
              <p className="text-gray-600 dark:text-gray-400">DIČ: {invoice.customer.dic}</p>
            )}
            {invoice.customer?.address && (
              <p className="text-gray-600 dark:text-gray-400">{invoice.customer.address}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader>
          <CardTitle>Položky faktury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-200 dark:border-purple-800">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Popis</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Mn.</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Jed.</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Cena/jed.</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">DPH</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Celkem</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}>
                    <td className="py-2.5 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-2.5 px-3 text-sm font-medium text-gray-900 dark:text-white">{item.description}</td>
                    <td className="py-2.5 px-3 text-sm text-right text-gray-700 dark:text-gray-300">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-sm text-center text-gray-500 dark:text-gray-400">{item.unit || 'ks'}</td>
                    <td className="py-2.5 px-3 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2.5 px-3 text-sm text-right text-gray-500 dark:text-gray-400">{item.vat_rate}%</td>
                    <td className="py-2.5 px-3 text-sm text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total_with_vat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 ml-auto max-w-xs space-y-1">
            {Array.from(vatRecap.entries()).map(([rate, data]) => (
              <div key={rate} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Základ DPH {rate}%</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(data.base)}</span>
              </div>
            ))}
            {Array.from(vatRecap.entries()).map(([rate, data]) => (
              <div key={`vat-${rate}`} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">DPH {rate}%</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(data.vat)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Celkem bez DPH</span>
              <span className="font-semibold">{formatCurrency(invoice.total_without_vat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">DPH celkem</span>
              <span className="font-semibold">{formatCurrency(invoice.total_vat)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-purple-300 dark:border-purple-700">
              <span className="text-base font-bold text-gray-900 dark:text-white">CELKEM K ÚHRADĚ</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(invoice.total_with_vat)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment + QR */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600 dark:text-purple-400">Platební údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Číslo účtu</p>
              <p className="font-semibold text-gray-900 dark:text-white">{supplier?.bankAccount}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">IBAN</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {supplier?.iban ? supplier.iban.replace(/(.{4})/g, '$1 ').trim() : '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Variabilní symbol</p>
              <p className="font-semibold text-gray-900 dark:text-white">{invoice.variable_symbol}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Částka k úhradě</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(invoice.total_with_vat)}
              </p>
            </div>
          </CardContent>
        </Card>

        <PaymentQR
          amount={invoice.total_with_vat}
          bankAccount={supplier?.iban || supplier?.bankAccount || ''}
          variableSymbol={invoice.variable_symbol}
          invoiceNumber={invoice.invoice_number}
          dueDate={invoice.due_date}
        />
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Akce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.open(`/api/accountant/invoices/${invoice.id}/pdf`, '_blank')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Stáhnout PDF
            </Button>

            <Button
              onClick={() => setSendDialogOpen(true)}
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Odeslat emailem
            </Button>

            {invoice.status === 'draft' && (
              <Button onClick={handleMarkAsSent} variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Označit jako odeslanou
              </Button>
            )}

            {invoice.status === 'sent' && (
              <Button onClick={handleMarkAsPaid} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Označit jako zaplacenou
              </Button>
            )}

            {invoice.status === 'draft' && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Mažu...' : 'Smazat'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send invoice dialog */}
      <SendInvoiceDialog
        invoice={invoice}
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSent={(updated) => setInvoice(updated)}
      />
    </div>
  )
}
