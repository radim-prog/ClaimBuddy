'use client'

import { useState, useEffect, Component, ReactNode } from 'react'
import {
  X, CheckCircle, Send, Download, Printer, Edit3, Copy, RotateCcw, Trash2, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InvoicePrintPreview } from './invoice-print-preview'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Simple error boundary to prevent whole page crash
class PreviewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error) { console.error('InvoicePrintPreview crash:', error) }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center text-gray-500">Náhled nelze zobrazit</div>
    }
    return this.props.children
  }
}

interface InvoiceItem {
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

interface ClientInvoice {
  id: string
  company_id: string
  invoice_number: string
  document_type?: string
  partner?: { name: string; ico?: string; dic?: string; address?: string }
  partner_name?: string
  items?: InvoiceItem[]
  total_without_vat?: number
  total_vat?: number
  total_with_vat?: number
  amount?: number
  issue_date: string
  due_date?: string
  tax_date?: string
  status: string
  payment_method?: string
  constant_symbol?: string
  specific_symbol?: string
  variable_symbol?: string
  notes?: string
  issued_by?: string
  issued_by_phone?: string
  issued_by_email?: string
}

interface SupplierData {
  name: string
  ico: string
  dic?: string
  address?: string | { street?: string; city?: string; zip?: string }
}

interface InvoiceDetailOverlayProps {
  invoice: ClientInvoice
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onConvert?: (targetType: string) => void
  onStatusChange?: () => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Koncept', className: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Odesláno', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Zaplaceno', className: 'bg-green-100 text-green-800' },
  overdue: { label: 'Po splatnosti', className: 'bg-red-100 text-red-800' },
}

const docTypeLabels: Record<string, string> = {
  invoice: 'Faktura',
  proforma: 'Zálohová faktura',
  credit_note: 'Dobropis',
}

function isOverdue(invoice: ClientInvoice): boolean {
  if (invoice.status === 'paid') return false
  if (!invoice.due_date) return false
  return new Date(invoice.due_date) < new Date()
}

export function InvoiceDetailOverlay({
  invoice,
  open,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onConvert,
  onStatusChange,
}: InvoiceDetailOverlayProps) {
  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [sending, setSending] = useState(false)

  const overdue = isOverdue(invoice)
  const displayStatus = overdue ? 'overdue' : invoice.status
  const statusInfo = statusConfig[displayStatus] || statusConfig.draft
  const docType = invoice.document_type || 'invoice'
  const total = invoice.total_with_vat ?? invoice.amount ?? 0

  // Fetch supplier info and QR code
  useEffect(() => {
    if (!open) return

    fetch(`/api/client/invoices/${invoice.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.supplier) setSupplier(data.supplier)
      })
      .catch(() => {})

    // Generate QR via API
    if (total > 0 && invoice.variable_symbol) {
      fetch(`/api/invoices/${invoice.id}/qr`)
        .then(r => r.json())
        .then(data => {
          if (data.dataUrl) setQrDataUrl(data.dataUrl)
        })
        .catch(() => {})
    }
  }, [open, invoice.id, total, invoice.variable_symbol])

  const handleMarkPaid = async () => {
    setMarkingPaid(true)
    try {
      const res = await fetch(`/api/client/invoices/${invoice.id}/mark-paid`, { method: 'POST' })
      if (res.ok) {
        toast.success('Faktura označena jako zaplacená')
        onStatusChange?.()
        onClose()
      } else {
        toast.error('Nepodařilo se označit jako zaplacenou')
      }
    } catch {
      toast.error('Chyba při označování')
    } finally {
      setMarkingPaid(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/client/invoices/${invoice.id}/send`, { method: 'POST' })
      if (res.ok) {
        toast.success('Faktura označena jako odeslaná')
        onStatusChange?.()
        onClose()
      } else {
        toast.error('Nepodařilo se odeslat')
      }
    } catch {
      toast.error('Chyba při odesílání')
    } finally {
      setSending(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors no-print"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Print Preview */}
        <div className="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-800 p-4 md:p-6 flex justify-center">
          <div className="w-full max-w-[794px]">
            <PreviewErrorBoundary>
              <InvoicePrintPreview
                invoice={invoice}
                supplier={supplier}
                qrDataUrl={qrDataUrl}
              />
            </PreviewErrorBoundary>
          </div>
        </div>

        {/* Right panel: Actions (desktop) / Bottom actions (mobile) */}
        <div className="hidden md:flex flex-col w-72 bg-white dark:bg-gray-900 border-l dark:border-gray-700 overflow-y-auto no-print">
          <div className="p-5 space-y-4">
            {/* Status */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {docTypeLabels[docType] || 'Faktura'}
                </Badge>
                <Badge className={cn('rounded-md text-xs', statusInfo.className)}>
                  {statusInfo.label}
                </Badge>
              </div>
              <h2 className="text-lg font-bold mt-2">{invoice.invoice_number}</h2>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {total.toLocaleString('cs-CZ')} Kč
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {invoice.status !== 'paid' && (
                <Button
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {markingPaid ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                  Zaplaceno
                </Button>
              )}

              {invoice.status === 'draft' && (
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Odeslat
                </Button>
              )}

              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`/api/client/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener">
                  <Download className="h-4 w-4 mr-1" />
                  Stáhnout PDF
                </a>
              </Button>

              <Button variant="outline" size="sm" className="w-full" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Tisk
              </Button>

              <div className="border-t pt-2 mt-2" />

              {invoice.status === 'draft' && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { onClose(); onEdit() }}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Upravit
                </Button>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={() => { onClose(); onDuplicate() }}>
                <Copy className="h-4 w-4 mr-1" />
                Duplikovat
              </Button>

              {onConvert && docType === 'invoice' && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { onClose(); onConvert('credit_note') }}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Vystavit dobropis
                </Button>
              )}

              {onConvert && docType === 'proforma' && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => { onClose(); onConvert('invoice') }}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Převést na fakturu
                </Button>
              )}

              <div className="border-t pt-2 mt-2" />

              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => { onClose(); onDelete() }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Smazat
              </Button>
            </div>

            {/* Metadata */}
            <div className="border-t pt-3 space-y-2 text-xs text-gray-500">
              {invoice.issued_by && (
                <p>Vystavil: {invoice.issued_by}</p>
              )}
              {invoice.due_date && (
                <p>Splatnost: {new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</p>
              )}
              {invoice.payment_method && (
                <p>Platba: {invoice.payment_method === 'bank_transfer' ? 'Převodem' : invoice.payment_method === 'cash' ? 'Hotově' : 'Kartou'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 p-3 flex gap-2 overflow-x-auto no-print z-[61]">
          {invoice.status !== 'paid' && (
            <Button onClick={handleMarkPaid} disabled={markingPaid} size="sm" className="bg-green-600 hover:bg-green-700 text-white shrink-0">
              <CheckCircle className="h-4 w-4 mr-1" />
              Zaplaceno
            </Button>
          )}
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a href={`/api/client/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener">
              <Download className="h-4 w-4 mr-1" />
              PDF
            </a>
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
          {invoice.status === 'draft' && (
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => { onClose(); onEdit() }}>
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => { onClose(); onDuplicate() }}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 text-red-600" onClick={() => { onClose(); onDelete() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
