'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PaymentQR } from '@/components/invoice/payment-qr'
import { SUPPLIER } from '@/lib/invoice-config'
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  X,
} from 'lucide-react'

type BillingInvoice = {
  id: string
  period: string
  amount_due: number
  status: string
  due_date: string
  paid_at: string | null
  created_at: string
  linked_invoice: {
    id: string
    invoice_number: string
    variable_symbol: string
  } | null
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  paid: { label: 'Zaplaceno', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Nezaplaceno', variant: 'secondary', icon: Clock },
  overdue: { label: 'Po splatnosti', variant: 'destructive', icon: AlertTriangle },
  failed: { label: 'Platba se nezdařila', variant: 'destructive', icon: AlertTriangle },
  waived: { label: 'Odpuštěno', variant: 'outline', icon: CheckCircle2 },
  refunded: { label: 'Vráceno', variant: 'outline', icon: CheckCircle2 },
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
  return `${months[parseInt(month, 10) - 1]} ${year}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ')
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(amount)
}

export default function ClientBillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <ClientBillingContent />
    </Suspense>
  )
}

function ClientBillingContent() {
  const { selectedCompanyId, selectedCompany } = useClientUser()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<BillingInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [qrInvoice, setQrInvoice] = useState<BillingInvoice | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchInvoices = useCallback(async () => {
    if (!selectedCompanyId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/client/billing?company_id=${selectedCompanyId}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedCompanyId])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setSuccessMsg('Platba byla úspěšně zpracována. Stav faktury se zaktualizuje během chvíle.')
      // Refresh after a short delay to pick up webhook update
      const t = setTimeout(fetchInvoices, 3000)
      return () => clearTimeout(t)
    }
  }, [searchParams, fetchInvoices])

  const handleStripePayment = async (invoice: BillingInvoice) => {
    setPayingId(invoice.id)
    try {
      const res = await fetch('/api/client/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_invoice_id: invoice.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // silent
    } finally {
      setPayingId(null)
    }
  }

  const unpaidCount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'failed').length
  const totalUnpaid = invoices
    .filter(i => i.status === 'pending' || i.status === 'overdue' || i.status === 'failed')
    .reduce((sum, i) => sum + i.amount_due, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platby</h1>
        <p className="text-muted-foreground mt-1">
          Přehled faktur za účetní služby{selectedCompany ? ` pro ${selectedCompany.name}` : ''}
        </p>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200 flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="h-4 w-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Summary cards */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Celkem faktur</div>
              <div className="text-2xl font-bold mt-1">{invoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Nezaplaceno</div>
              <div className="text-2xl font-bold mt-1 text-amber-600">{unpaidCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">K úhradě</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalUnpaid)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR overlay */}
      {qrInvoice && qrInvoice.linked_invoice && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">QR platba – {formatPeriod(qrInvoice.period)}</CardTitle>
            <button onClick={() => setQrInvoice(null)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </CardHeader>
          <CardContent className="flex justify-center">
            <PaymentQR
              amount={qrInvoice.amount_due}
              bankAccount={SUPPLIER.bankAccount}
              variableSymbol={qrInvoice.linked_invoice.variable_symbol}
              invoiceNumber={qrInvoice.linked_invoice.invoice_number}
              dueDate={qrInvoice.due_date}
              className="border-0 shadow-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Invoice list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Faktury za služby
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedCompanyId ? (
            <p className="text-muted-foreground text-center py-8">Vyberte firmu pro zobrazení faktur.</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Zatím nemáte žádné faktury za účetní služby.</p>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => {
                const cfg = statusConfig[inv.status] || statusConfig.pending
                const StatusIcon = cfg.icon
                const isPayable = inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'failed'
                const isOverdue = inv.status !== 'paid' && inv.status !== 'waived' && inv.status !== 'refunded' && new Date(inv.due_date) < new Date()

                return (
                  <div key={inv.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Period + status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatPeriod(inv.period)}</span>
                          <Badge variant={isOverdue && inv.status !== 'paid' ? 'destructive' : cfg.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue && inv.status === 'pending' ? 'Po splatnosti' : cfg.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          Splatnost: {formatDate(inv.due_date)}
                          {inv.paid_at && ` | Zaplaceno: ${formatDate(inv.paid_at)}`}
                          {inv.linked_invoice && ` | ${inv.linked_invoice.invoice_number}`}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(inv.amount_due)}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:ml-4">
                        {isPayable && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStripePayment(inv)}
                              disabled={payingId === inv.id}
                            >
                              {payingId === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <CreditCard className="h-4 w-4 mr-1" />
                              )}
                              Zaplatit kartou
                            </Button>
                            {inv.linked_invoice && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQrInvoice(qrInvoice?.id === inv.id ? null : inv)}
                              >
                                QR
                              </Button>
                            )}
                          </>
                        )}
                        {inv.linked_invoice && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a
                              href={`/api/accountant/invoices/${inv.linked_invoice.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
