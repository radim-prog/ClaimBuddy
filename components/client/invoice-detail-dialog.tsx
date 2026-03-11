'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Edit3, Copy, Trash2, ArrowRightLeft, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InvoiceItem {
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  total_without_vat: number
  total_with_vat: number
}

interface ClientInvoice {
  id: string
  company_id: string
  invoice_number: string
  type?: string
  document_type?: string
  partner?: { name: string; ico?: string; dic?: string; address?: string }
  partner_name?: string
  items?: InvoiceItem[]
  total_without_vat?: number
  total_vat?: number
  total_with_vat?: number
  amount?: number
  currency?: string
  issue_date: string
  due_date?: string
  status: string
  payment_method?: string
  constant_symbol?: string
  specific_symbol?: string
  variable_symbol?: string
  notes?: string
  issued_by?: string
  issued_by_phone?: string
  issued_by_email?: string
  converted_from_id?: string
}

interface InvoiceDetailDialogProps {
  invoice: ClientInvoice
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onConvert?: (targetType: string) => void
}

const docTypeLabels: Record<string, string> = {
  invoice: 'Faktura',
  proforma: 'Zálohová faktura',
  credit_note: 'Dobropis',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Koncept', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Odesláno', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  paid: { label: 'Zaplaceno', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  overdue: { label: 'Po splatnosti', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Převodem',
  cash: 'Hotově',
  card: 'Kartou',
}

function isOverdue(invoice: ClientInvoice): boolean {
  if (invoice.status === 'paid') return false
  if (!invoice.due_date) return false
  return new Date(invoice.due_date) < new Date()
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onDelete,
  onConvert,
}: InvoiceDetailDialogProps) {
  const overdue = isOverdue(invoice)
  const displayStatus = overdue ? 'overdue' : invoice.status
  const statusInfo = statusConfig[displayStatus] || statusConfig.draft
  const docType = invoice.document_type || 'invoice'
  const total = invoice.total_with_vat ?? invoice.amount ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-xl">
              {invoice.invoice_number}
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {docTypeLabels[docType] || 'Faktura'}
            </Badge>
            <Badge className={cn('rounded-md', statusInfo.className)}>
              {statusInfo.label}
            </Badge>
          </div>
          <DialogDescription>
            {docTypeLabels[docType] || 'Faktura'} ze dne {new Date(invoice.issue_date).toLocaleDateString('cs-CZ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Customer section */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Odběratel</h4>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{invoice.partner?.name || invoice.partner_name || 'Neuvedeno'}</p>
              {invoice.partner?.ico && <p className="text-muted-foreground">IČO: {invoice.partner.ico}</p>}
              {invoice.partner?.dic && <p className="text-muted-foreground">DIČ: {invoice.partner.dic}</p>}
              {invoice.partner?.address && <p className="text-muted-foreground">{invoice.partner.address}</p>}
            </div>
          </div>

          {/* Items table */}
          {invoice.items && invoice.items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Položky</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Popis</th>
                      <th className="text-right px-3 py-2 font-medium w-16">Mn.</th>
                      <th className="text-right px-3 py-2 font-medium w-16">Jedn.</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Cena/ks</th>
                      <th className="text-right px-3 py-2 font-medium w-16">DPH</th>
                      <th className="text-right px-3 py-2 font-medium w-24">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => {
                      const itemTotal = item.total_with_vat || (item.quantity * item.unit_price * (1 + item.vat_rate / 100))
                      return (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="text-right px-3 py-2">{item.quantity}</td>
                          <td className="text-right px-3 py-2">{item.unit}</td>
                          <td className="text-right px-3 py-2">{item.unit_price.toLocaleString('cs-CZ')} Kč</td>
                          <td className="text-right px-3 py-2">{item.vat_rate}%</td>
                          <td className="text-right px-3 py-2 font-medium">{Math.round(itemTotal).toLocaleString('cs-CZ')} Kč</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border rounded-lg p-3 space-y-1 text-sm">
            {invoice.total_without_vat != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Základ</span>
                <span>{invoice.total_without_vat.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
            {invoice.total_vat != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">DPH</span>
                <span>{invoice.total_vat.toLocaleString('cs-CZ')} Kč</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Celkem</span>
              <span className="text-green-600">{total.toLocaleString('cs-CZ')} Kč</span>
            </div>
          </div>

          {/* Payment details */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Platební údaje</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {invoice.variable_symbol && (
                <div><span className="text-muted-foreground">VS: </span><span className="font-mono">{invoice.variable_symbol}</span></div>
              )}
              {invoice.constant_symbol && (
                <div><span className="text-muted-foreground">KS: </span><span className="font-mono">{invoice.constant_symbol}</span></div>
              )}
              {invoice.specific_symbol && (
                <div><span className="text-muted-foreground">SS: </span><span className="font-mono">{invoice.specific_symbol}</span></div>
              )}
              {invoice.payment_method && (
                <div><span className="text-muted-foreground">Platba: </span>{paymentMethodLabels[invoice.payment_method] || invoice.payment_method}</div>
              )}
              {invoice.due_date && (
                <div><span className="text-muted-foreground">Splatnost: </span>{new Date(invoice.due_date).toLocaleDateString('cs-CZ')}</div>
              )}
            </div>
          </div>

          {/* Additional info */}
          {(invoice.issued_by || invoice.notes) && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Další</h4>
              <div className="text-sm space-y-1">
                {invoice.issued_by && (
                  <p>
                    <span className="text-muted-foreground">Vystavil: </span>
                    {invoice.issued_by}
                    {invoice.issued_by_phone && ` · ${invoice.issued_by_phone}`}
                    {invoice.issued_by_email && ` · ${invoice.issued_by_email}`}
                  </p>
                )}
                {invoice.notes && (
                  <p><span className="text-muted-foreground">Poznámka: </span>{invoice.notes}</p>
                )}
                {invoice.converted_from_id && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowRightLeft className="h-3 w-3" />
                    Konvertováno z jiného dokumentu
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/client/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener">
                <Download className="h-4 w-4 mr-1" />
                PDF
              </a>
            </Button>
            {invoice.status === 'draft' && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-1" />
                Editovat
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-1" />
              Duplikovat
            </Button>
            {onConvert && docType === 'proforma' && (
              <Button variant="outline" size="sm" onClick={() => onConvert('invoice')}>
                <FileText className="h-4 w-4 mr-1" />
                Převést na fakturu
              </Button>
            )}
            {onConvert && docType === 'invoice' && (
              <Button variant="outline" size="sm" onClick={() => onConvert('credit_note')}>
                <FileText className="h-4 w-4 mr-1" />
                Vystavit dobropis
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Smazat
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
