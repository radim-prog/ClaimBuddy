'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Receipt, Loader2, Download, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { ClientInvoiceForm } from '@/components/client/invoice-form'
import { InvoiceDetailOverlay } from '@/components/client/invoice-detail-overlay'
import { InvoiceOverlay } from '@/components/client/action-hub/invoice-overlay'
import { toast } from 'sonner'

type FormMode = { type: 'new' } | { type: 'edit'; invoice: any } | { type: 'duplicate'; invoice: any }
type StatusFilter = 'all' | 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue'
type DateFilter = 'all' | 'this_month' | 'this_year'
type SortOrder = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
type DocTypeFilter = 'all' | 'invoice' | 'proforma' | 'credit_note'

const docTypeTabLabels: Record<string, string> = {
  all: 'Vše',
  invoice: 'Faktury',
  proforma: 'Zálohové',
  credit_note: 'Dobropisy',
}

const docTypeBadgeLabel: Record<string, string> = {
  invoice: 'Faktura',
  proforma: 'Zálohová faktura',
  credit_note: 'Dobropis',
}

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

export default function InvoicesPage() {
  const { companies, loading: companiesLoading, selectedCompanyId } = useClientUser()
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const selectedCompany = selectedCompanyId

  const [refreshKey, setRefreshKey] = useState(0)
  const handleCreated = () => {
    setFormMode(null)
    setRefreshKey(k => k + 1)
    toast.success(formMode?.type === 'edit' ? 'Faktura uložena' : 'Faktura vytvořena')
  }

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const companyId = selectedCompany || companies[0]?.id || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Faktury</h1>
        <p className="text-muted-foreground">Vystavujte a spravujte své faktury</p>
      </div>

      {/* Action button */}
      <div>
        <button
          onClick={() => setShowOverlay(true)}
          className="h-14 w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium text-base shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all active:scale-[0.98]"
        >
          <Receipt className="h-5 w-5 flex-shrink-0" />
          Vystavit fakturu
        </button>
      </div>


      {formMode && selectedCompany && (
        <ClientInvoiceForm
          companyId={selectedCompany}
          onClose={() => setFormMode(null)}
          onCreated={handleCreated}
          editInvoice={formMode.type === 'edit' ? formMode.invoice : undefined}
          duplicateFrom={formMode.type === 'duplicate' ? formMode.invoice : undefined}
        />
      )}

      {selectedCompany && (
        <ClientInvoiceListView
          key={refreshKey}
          companyId={selectedCompany}
          onEdit={(inv) => setFormMode({ type: 'edit', invoice: inv })}
          onDuplicate={(inv) => setFormMode({ type: 'duplicate', invoice: inv })}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* Overlay for quick create */}
      <InvoiceOverlay
        open={showOverlay}
        companyId={companyId}
        onClose={() => {
          setShowOverlay(false)
          setRefreshKey(k => k + 1)
        }}
      />
    </div>
  )
}

function ClientInvoiceListView({
  companyId,
  onEdit,
  onDuplicate,
  onRefresh,
}: {
  companyId: string
  onEdit: (inv: any) => void
  onDuplicate: (inv: any) => void
  onRefresh: () => void
}) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [docTypeFilter, setDocTypeFilter] = useState<DocTypeFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailInvoice, setDetailInvoice] = useState<any | null>(null)

  const fetchInvoices = () => {
    setLoading(true)
    fetch('/api/client/invoices')
      .then(r => r.ok ? r.json() : { invoices: [] })
      .then(data => setInvoices(data.invoices || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchInvoices() }, [companyId])

  const handleDelete = async (inv: any) => {
    if (!confirm('Opravdu chcete smazat tento doklad?')) return
    try {
      const res = await fetch(`/api/client/invoices/${inv.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Doklad smazán')
        setDetailInvoice(null)
        fetchInvoices()
        onRefresh()
      } else {
        toast.error('Smazání selhalo')
      }
    } catch {
      toast.error('Smazání selhalo')
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
        throw new Error(data.error || 'Konverze selhala')
      }
      toast.success(targetType === 'credit_note' ? 'Dobropis vytvořen' : 'Faktura vytvořena ze zálohové faktury')
      setDetailInvoice(null)
      fetchInvoices()
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Konverze selhala')
    }
  }

  // Count by document type (for tab badges)
  const docTypeCounts = {
    all: invoices.length,
    invoice: invoices.filter(i => (i.document_type || 'invoice') === 'invoice').length,
    proforma: invoices.filter(i => (i.document_type || 'invoice') === 'proforma').length,
    credit_note: invoices.filter(i => (i.document_type || 'invoice') === 'credit_note').length,
  }

  // Unpaid count for badge
  const unpaidCount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'draft').length

  // Filter invoices
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

      // Date filter
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

    // Sort
    result.sort((a, b) => {
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

  // Summary stats
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
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Celkem</p>
            <p className="text-lg font-bold">{totalCount}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Nezaplaceno</p>
            <p className="text-lg font-bold text-amber-600">{unpaidAmount.toLocaleString('cs-CZ')} Kč</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Po splatnosti</p>
            <p className={cn('text-lg font-bold', overdueCount > 0 ? 'text-red-600' : '')}>{overdueCount}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Zaplaceno</p>
            <p className="text-lg font-bold text-green-600">{paidAmount.toLocaleString('cs-CZ')} Kč</p>
          </CardContent></Card>
        </div>
      )}

      {/* Document type tabs */}
      {invoices.length > 0 && (
        <div className="space-y-3">
          <div className="flex border-b">
            {(['all', 'invoice', 'proforma', 'credit_note'] as DocTypeFilter[]).map(tab => (
              <button
                key={tab}
                onClick={() => setDocTypeFilter(tab)}
                className={cn(
                  'px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                  docTypeFilter === tab
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {docTypeTabLabels[tab]}
                {docTypeCounts[tab] > 0 && (
                  <span className={cn(
                    'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                    docTypeFilter === tab ? 'bg-violet-100 text-violet-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {docTypeCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'draft', 'sent', 'unpaid', 'paid', 'overdue'] as StatusFilter[]).map(f => {
              const label = f === 'all' ? 'Vše' : f === 'draft' ? 'Koncept' : f === 'sent' ? 'Odesláno'
                : f === 'unpaid' ? `Nezaplaceno${unpaidCount > 0 ? ` (${unpaidCount})` : ''}`
                : f === 'paid' ? 'Zaplaceno' : `Po splatnosti${overdueCount > 0 ? ` (${overdueCount})` : ''}`
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    statusFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Date filter + sort + search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {(['all', 'this_month', 'this_year'] as DateFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors border',
                    dateFilter === f
                      ? 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700'
                      : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted'
                  )}
                >
                  {f === 'all' ? 'Vše' : f === 'this_month' ? 'Tento měsíc' : 'Tento rok'}
                </button>
              ))}
            </div>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
              className="h-7 px-2 rounded-md border border-input bg-background text-xs cursor-pointer"
            >
              <option value="newest">Nejnovější</option>
              <option value="oldest">Nejstarší</option>
              <option value="amount_desc">Částka ↓</option>
              <option value="amount_asc">Částka ↑</option>
            </select>
            <Input
              placeholder="Hledat číslo, partner..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-7 text-xs flex-1 min-w-[120px]"
            />
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné vydané doklady</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice list with colored rows */}
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
                  'cursor-pointer transition-colors hover:shadow-md',
                  rowBg
                )}
                onClick={() => setDetailInvoice(inv)}
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
                        {invDocType !== 'invoice' && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                            {docTypeBadgeLabel[invDocType] || invDocType}
                          </Badge>
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
          onClose={() => setDetailInvoice(null)}
          onEdit={() => { setDetailInvoice(null); onEdit(detailInvoice) }}
          onDuplicate={() => { setDetailInvoice(null); onDuplicate(detailInvoice) }}
          onDelete={() => handleDelete(detailInvoice)}
          onConvert={(targetType) => handleConvert(detailInvoice, targetType)}
          onStatusChange={() => { setDetailInvoice(null); fetchInvoices(); onRefresh() }}
        />
      )}
    </div>
  )
}
