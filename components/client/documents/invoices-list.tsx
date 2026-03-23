'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Receipt, Loader2, Download, Plus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { InvoiceDetailOverlay } from '@/components/client/invoice-detail-overlay'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'
import { toast } from 'sonner'

type StatusFilter = 'all' | 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue'
type DateFilter = 'all' | 'this_month' | 'this_year'
type SortOrder = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
type DocTypeFilter = 'all' | 'invoice' | 'proforma' | 'credit_note'

const statusRowBg: Record<string, string> = {
  paid: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
  sent: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  draft: '',
  overdue: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
}

function isInvoiceOverdue(inv: any): boolean {
  if (inv.status === 'paid') return false
  if (!inv.due_date) return false
  return new Date(inv.due_date) < new Date()
}

interface InvoicesListProps {
  companyId: string
  onEdit?: (inv: any) => void
  onDuplicate?: (inv: any) => void
  onRefresh?: () => void
  onNew?: () => void
  /** Hide action buttons when embedded */
  compact?: boolean
}

export function InvoicesList({
  companyId,
  onEdit,
  onDuplicate,
  onRefresh,
  onNew,
  compact = false,
}: InvoicesListProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { filters, setFilter } = useUrlFilters({
    status: 'all',
    docType: 'all',
    date: 'all',
    sort: 'newest',
    q: '',
    detail: '',
  })

  const statusFilter = filters.status as StatusFilter
  const docTypeFilter = filters.docType as DocTypeFilter
  const dateFilter = filters.date as DateFilter
  const sortOrder = filters.sort as SortOrder
  const searchQuery = filters.q

  const fetchInvoices = useCallback(() => {
    setLoading(true)
    fetch('/api/client/invoices')
      .then(r => r.ok ? r.json() : { invoices: [] })
      .then(data => setInvoices(data.invoices || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchInvoices() }, [companyId, fetchInvoices])

  const detailInvoice = useMemo(() => {
    if (!filters.detail) return null
    return invoices.find(inv => inv.id === filters.detail) || null
  }, [filters.detail, invoices])

  const handleDelete = async (inv: any) => {
    if (!confirm('Opravdu chcete smazat tento doklad?')) return
    try {
      const res = await fetch(`/api/client/invoices/${inv.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Doklad smazán')
        setFilter('detail', '')
        fetchInvoices()
        onRefresh?.()
      } else {
        toast.error('Smazání se nezdařilo')
      }
    } catch {
      toast.error('Smazání se nezdařilo')
    }
  }

  const handleConvert = async (inv: any, targetType: string) => {
    try {
      const res = await fetch(`/api/client/invoices/${inv.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Konverze se nezdařila')
      }
      toast.success(targetType === 'credit_note' ? 'Dobropis vytvořen' : 'Faktura vytvořena ze zálohové faktury')
      setFilter('detail', '')
      fetchInvoices()
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Konverze se nezdařila')
    }
  }

  const docTypeCounts = {
    all: invoices.length,
    invoice: invoices.filter(i => (i.document_type || 'invoice') === 'invoice').length,
    proforma: invoices.filter(i => (i.document_type || 'invoice') === 'proforma').length,
    credit_note: invoices.filter(i => (i.document_type || 'invoice') === 'credit_note').length,
  }

  const unpaidCount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'draft').length

  const filtered = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisYear = String(now.getFullYear())

    const result = invoices.filter(inv => {
      const overdue = isInvoiceOverdue(inv)
      if (statusFilter === 'overdue' && !overdue) return false
      if (statusFilter === 'draft' && inv.status !== 'draft') return false
      if (statusFilter === 'sent' && inv.status !== 'sent') return false
      if (statusFilter === 'paid' && inv.status !== 'paid') return false
      if (statusFilter === 'unpaid' && (inv.status === 'paid' || inv.status === 'draft')) return false

      const invDocType = inv.document_type || 'invoice'
      if (docTypeFilter !== 'all' && invDocType !== docTypeFilter) return false

      if (dateFilter !== 'all' && inv.issue_date) {
        if (dateFilter === 'this_month' && !inv.issue_date.startsWith(thisMonth)) return false
        if (dateFilter === 'this_year' && !inv.issue_date.startsWith(thisYear)) return false
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesNumber = inv.invoice_number?.toLowerCase().includes(q)
        const matchesPartner = (inv.partner?.name || inv.partner_name || '').toLowerCase().includes(q)
        if (!matchesNumber && !matchesPartner) return false
      }

      return true
    })

    result.sort((a: any, b: any) => {
      switch (sortOrder) {
        case 'newest': return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
        case 'oldest': return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime()
        case 'amount_desc': return (b.total_with_vat || b.amount || 0) - (a.total_with_vat || a.amount || 0)
        case 'amount_asc': return (a.total_with_vat || a.amount || 0) - (b.total_with_vat || b.amount || 0)
        default: return 0
      }
    })

    return result
  }, [invoices, statusFilter, docTypeFilter, dateFilter, sortOrder, searchQuery])

  const totalCount = invoices.length
  const unpaidAmount = invoices
    .filter(inv => inv.status !== 'paid' && (inv.document_type || 'invoice') !== 'credit_note')
    .reduce((s, inv) => s + (inv.total_with_vat || inv.amount || 0), 0)
  const overdueCount = invoices.filter(isInvoiceOverdue).length
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((s, inv) => s + (inv.total_with_vat || inv.amount || 0), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {invoices.length > 0 && !compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="rounded-2xl"><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Celkem</p>
            <p className="text-lg font-bold">{totalCount}</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Nezaplaceno</p>
            <p className="text-lg font-bold text-amber-600">{unpaidAmount.toLocaleString('cs-CZ')} Kč</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Po splatnosti</p>
            <p className={cn('text-lg font-bold', overdueCount > 0 ? 'text-red-600' : '')}>{overdueCount}</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Zaplaceno</p>
            <p className="text-lg font-bold text-green-600">{paidAmount.toLocaleString('cs-CZ')} Kč</p>
          </CardContent></Card>
        </div>
      )}

      {/* Filter bar */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Hledat číslo, partner..."
              value={searchQuery}
              onChange={e => setFilter('q', e.target.value)}
              className="h-8 text-xs flex-1 min-w-[160px]"
            />
            <Select value={docTypeFilter} onValueChange={v => setFilter('docType', v)}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny typy</SelectItem>
                <SelectItem value="invoice">Faktury ({docTypeCounts.invoice})</SelectItem>
                <SelectItem value="proforma">Zálohové ({docTypeCounts.proforma})</SelectItem>
                <SelectItem value="credit_note">
                  <span className="inline-flex items-center gap-1">
                    Dobropisy ({docTypeCounts.credit_note})
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">Opravný doklad — snižuje původní fakturovanou částku</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={v => setFilter('date', v)}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Celé období</SelectItem>
                <SelectItem value="this_month">Tento měsíc</SelectItem>
                <SelectItem value="this_year">Tento rok</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={v => setFilter('sort', v)}>
              <SelectTrigger className="h-8 text-xs w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nejnovější</SelectItem>
                <SelectItem value="oldest">Nejstarší</SelectItem>
                <SelectItem value="amount_desc">Částka ↓</SelectItem>
                <SelectItem value="amount_asc">Částka ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'draft', 'sent', 'unpaid', 'paid', 'overdue'] as StatusFilter[]).map(f => {
              const label = f === 'all' ? 'Vše'
                : f === 'draft' ? 'Koncept'
                : f === 'sent' ? 'Odesláno'
                : f === 'unpaid' ? `Nezaplaceno${unpaidCount > 0 ? ` (${unpaidCount})` : ''}`
                : f === 'paid' ? 'Zaplaceno'
                : `Po splatnosti${overdueCount > 0 ? ` (${overdueCount})` : ''}`
              return (
                <button
                  key={f}
                  onClick={() => setFilter('status', f)}
                  className={cn(
                    'filter-pill',
                    statusFilter === f ? 'filter-pill-active' : 'filter-pill-inactive'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Zatím nemáte žádné faktury</p>
            <p className="text-sm text-muted-foreground mb-5">Vystavte svou první fakturu — jednoduše a rychle.</p>
            {onNew && (
              <Button onClick={onNew} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Vystavit fakturu
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoice list */}
      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((inv: any) => {
            const overdue = isInvoiceOverdue(inv)
            const invDocType = inv.document_type || 'invoice'
            const total = inv.total_with_vat || inv.amount || 0
            const rowStatus = overdue ? 'overdue' : inv.status
            const rowBg = statusRowBg[rowStatus] || ''

            return (
              <Card
                key={inv.id}
                className={cn(
                  'rounded-2xl cursor-pointer transition-colors hover:shadow-md',
                  invDocType === 'proforma' ? 'border-l-4 border-l-orange-400 dark:border-l-orange-500' :
                  invDocType === 'credit_note' ? 'border-l-4 border-l-red-400 dark:border-l-red-500' :
                  '',
                  rowBg
                )}
                onClick={() => setFilter('detail', inv.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg shrink-0',
                      invDocType === 'credit_note' ? 'bg-red-50 dark:bg-red-950/30' :
                      invDocType === 'proforma' ? 'bg-amber-50 dark:bg-amber-950/30' :
                      'bg-green-50 dark:bg-green-950/30'
                    )}>
                      <Receipt className={cn(
                        'h-4 w-4',
                        invDocType === 'credit_note' ? 'text-red-600' :
                        invDocType === 'proforma' ? 'text-amber-600' :
                        'text-green-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">
                          {inv.invoice_number} — {inv.partner?.name || inv.partner_name || 'Neuvedeno'}
                        </p>
                        {invDocType === 'proforma' && (
                          <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0">
                            Záloha
                          </Badge>
                        )}
                        {invDocType === 'credit_note' && (
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className="text-[10px] px-1.5 py-0 shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 cursor-help">
                                  Dobropis
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Opravný doklad — snižuje původní fakturovanou částku</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(inv.issue_date).toLocaleDateString('cs-CZ')}</span>
                        {inv.due_date && (
                          <><span>·</span><span>Spl. {new Date(inv.due_date).toLocaleDateString('cs-CZ')}</span></>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/api/client/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener"
                        onClick={e => e.stopPropagation()}
                        className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Stáhnout PDF"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <span className={cn(
                        'text-sm font-semibold',
                        invDocType === 'credit_note' ? 'text-red-600' : 'text-green-600'
                      )}>
                        {total.toLocaleString('cs-CZ')} Kč
                      </span>
                      <Badge className={cn(
                        'rounded-md',
                        overdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        inv.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        inv.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      )}>
                        {overdue ? 'Po splatnosti' : inv.status === 'paid' ? 'Zaplaceno' : inv.status === 'sent' ? 'Odesláno' : 'Koncept'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && invoices.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Žádné doklady neodpovídají filtru
        </div>
      )}

      {/* Detail overlay */}
      {detailInvoice && (
        <InvoiceDetailOverlay
          invoice={detailInvoice}
          open={!!detailInvoice}
          onClose={() => setFilter('detail', '')}
          onEdit={() => { onEdit?.(detailInvoice) }}
          onDuplicate={() => { onDuplicate?.(detailInvoice) }}
          onDelete={() => handleDelete(detailInvoice)}
          onConvert={(targetType) => handleConvert(detailInvoice, targetType)}
          onStatusChange={() => { setFilter('detail', ''); fetchInvoices(); onRefresh?.() }}
        />
      )}
    </div>
  )
}
