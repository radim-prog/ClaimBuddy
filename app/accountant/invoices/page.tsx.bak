'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  Send,
  CheckCheck,
  Search,
  Eye,
  Mail,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Plus,
} from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/lib/mock-data'
import { toast } from 'sonner'

type FilterStatus = 'all' | InvoiceStatus

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: typeof FileText }> = {
  draft: {
    label: 'Koncept',
    color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300',
    icon: FileText,
  },
  sent: {
    label: 'Odesláno',
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Send,
  },
  paid: {
    label: 'Zaplaceno',
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'Storno',
    color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    icon: AlertTriangle,
  },
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('cs-CZ')
}

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  useEffect(() => {
    fetch('/api/accountant/invoices')
      .then(r => r.ok ? r.json() : { invoices: [] })
      .then(json => setInvoices(json.invoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = invoices
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(inv =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.company_name.toLowerCase().includes(q) ||
        (inv.customer?.name || '').toLowerCase().includes(q)
      )
    }
    if (filterStatus !== 'all') {
      result = result.filter(inv => inv.status === filterStatus)
    }
    return result
  }, [invoices, searchQuery, filterStatus])

  const summary = useMemo(() => {
    const total = invoices.reduce((s, inv) => s + inv.total_with_vat, 0)
    const paid = invoices.filter(i => i.status === 'paid').reduce((s, inv) => s + inv.total_with_vat, 0)
    const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, inv) => s + inv.total_with_vat, 0)
    const sentCount = invoices.filter(i => i.status === 'sent').length
    return { total, paid, unpaid, sentCount, count: invoices.length }
  }, [invoices])

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/accountant/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid', paid_at: new Date().toISOString() }),
      })
      if (!response.ok) throw new Error('Failed')
      const { invoice } = await response.json()
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? invoice : inv))
      toast.success('Faktura označena jako zaplacená')
    } catch {
      toast.error('Chyba při aktualizaci')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-purple-600 animate-spin" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítání faktur...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/accountant/invoicing">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Fakturace
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vystavené faktury</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Přehled všech vystavených faktur se statusy a akcemi
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/accountant/invoices/export?format=xlsx', '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/api/accountant/invoices/export?format=csv', '_blank')}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Link href="/accountant/invoices/new">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Nová faktura
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celkem faktur</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{summary.count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Celková částka</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(summary.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Zaplaceno</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.paid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nezaplaceno</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(summary.unpaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                placeholder="Hledat podle čísla, firmy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny statusy</SelectItem>
                <SelectItem value="draft">Koncept</SelectItem>
                <SelectItem value="sent">Odesláno</SelectItem>
                <SelectItem value="paid">Zaplaceno</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filtered.length} z {invoices.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Invoice table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Žádné faktury
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || filterStatus !== 'all'
                ? 'Zkuste změnit filtry'
                : 'Zatím nebyly vystaveny žádné faktury'}
            </p>
            <Link href="/accountant/invoicing">
              <Button className="mt-4" variant="outline">
                Přejít na fakturaci
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Číslo</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Firma</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Datum</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Splatnost</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Částka</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Akce</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const config = statusConfig[inv.status] || statusConfig.draft
                  const StatusIcon = config.icon
                  const isOverdue = inv.status === 'sent' && new Date(inv.due_date) < new Date()

                  return (
                    <tr
                      key={inv.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/accountant/invoices/${inv.id}`}
                          className="font-medium text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {inv.customer?.name || inv.company_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(inv.issue_date)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                          {formatDate(inv.due_date)}
                          {isOverdue && ' !'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(inv.total_with_vat)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/accountant/invoices/${inv.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Detail">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Stáhnout PDF"
                            onClick={() => window.open(`/api/accountant/invoices/${inv.id}/pdf`, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {inv.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              title="Označit jako zaplaceno"
                              onClick={() => handleMarkAsPaid(inv.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
