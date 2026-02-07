'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus,
  Download,
  Eye,
  FileText,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Send,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockInvoices, type Invoice, type InvoiceStatus } from '@/lib/mock-data'

// Status configuration for styling
const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: {
    label: 'Koncept',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 border-gray-200 dark:border-gray-700',
    icon: <FileText className="w-3 h-3" />
  },
  sent: {
    label: 'Odesláno',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Send className="w-3 h-3" />
  },
  paid: {
    label: 'Zaplaceno',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="w-3 h-3" />
  },
  cancelled: {
    label: 'Stornováno',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="w-3 h-3" />
  },
}

export default function ClientInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'issue_date' | 'due_date' | 'total_with_vat'>('issue_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filter invoices for client type (client_to_customer)
  const clientInvoices = useMemo(() => {
    return mockInvoices.filter(inv => inv.type === 'client_to_customer')
  }, [])

  // Apply filters and sorting
  const filteredInvoices = useMemo(() => {
    let result = clientInvoices

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(inv =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.customer?.name.toLowerCase().includes(query) ||
        inv.variable_symbol.includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      if (sortField === 'issue_date' || sortField === 'due_date') {
        comparison = new Date(a[sortField]).getTime() - new Date(b[sortField]).getTime()
      } else {
        comparison = a[sortField] - b[sortField]
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [clientInvoices, searchQuery, statusFilter, sortField, sortDirection])

  // Calculate stats
  const stats = useMemo(() => {
    const total = clientInvoices.length
    const draft = clientInvoices.filter(i => i.status === 'draft').length
    const sent = clientInvoices.filter(i => i.status === 'sent').length
    const paid = clientInvoices.filter(i => i.status === 'paid').length
    const totalAmount = clientInvoices
      .filter(i => i.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total_with_vat, 0)
    const paidAmount = clientInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, inv) => sum + inv.total_with_vat, 0)

    return { total, draft, sent, paid, totalAmount, paidAmount }
  }, [clientInvoices])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleDownloadXml = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices/export-xml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: [invoiceId], format: 'single' }),
      })

      if (response.ok) {
        const xml = await response.text()
        const blob = new Blob([xml], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        const invoice = clientInvoices.find(i => i.id === invoiceId)
        a.href = url
        a.download = `${invoice?.invoice_number || 'invoice'}.xml`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download XML:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('cs-CZ')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faktury</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Spravujte faktury pro vaše zákazníky
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/client/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova faktura
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Celkem faktur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Koncepty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Neuhrazeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Uhrazeno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Hledat podle cisla faktury, odberatele..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stav" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Vsechny stavy</SelectItem>
                <SelectItem value="draft">Koncepty</SelectItem>
                <SelectItem value="sent">Odeslane</SelectItem>
                <SelectItem value="paid">Zaplacene</SelectItem>
                <SelectItem value="cancelled">Stornovane</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Seznam faktur</CardTitle>
          <CardDescription>
            {filteredInvoices.length} z {clientInvoices.length} faktur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Zadne faktury</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                {clientInvoices.length === 0
                  ? 'Zatim jste nevytvorili zadnou fakturu.'
                  : 'Zadna faktura neodpovida vasim filtrum.'}
              </p>
              {clientInvoices.length === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/client/invoices/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Vytvorit prvni fakturu
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cislo faktury</TableHead>
                    <TableHead>Odberatel</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
                      onClick={() => handleSort('issue_date')}
                    >
                      <div className="flex items-center">
                        Datum vystaveni
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
                      onClick={() => handleSort('due_date')}
                    >
                      <div className="flex items-center">
                        Splatnost
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 text-right"
                      onClick={() => handleSort('total_with_vat')}
                    >
                      <div className="flex items-center justify-end">
                        Castka
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const status = statusConfig[invoice.status]
                    const isOverdue = invoice.status === 'sent' &&
                      new Date(invoice.due_date) < new Date()

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.customer?.name || '-'}</div>
                            {invoice.customer?.ico && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ICO: {invoice.customer.ico}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell>
                          <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(invoice.due_date)}
                            {isOverdue && (
                              <div className="text-xs">Po splatnosti!</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_with_vat)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${status.color} flex items-center gap-1 w-fit`}
                          >
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Zobrazit fakturu"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadXml(invoice.id)}
                              title="Stahnout pro Pohodu (XML)"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-lg">Export do Pohody</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Kazda faktura muze byt exportovana do XML formatu kompatibilniho s Pohodou.
            Staci kliknout na ikonu stahnuti u faktury a import soubor do vaseho ucetniho systemu.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Stahnout XML</span>
            </div>
            <span>→</span>
            <span>Import v Pohode: Soubor → Datova komunikace → XML import</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
