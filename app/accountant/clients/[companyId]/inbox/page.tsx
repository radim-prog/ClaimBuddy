'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompany } from '../layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Inbox,
  RefreshCw,
  FileText,
  Check,
  X,
  Clock,
  AlertCircle,
  Mail,
  Paperclip,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentInboxItem } from '@/lib/document-inbox-store'

type DocumentType = 'bank_statement' | 'expense_invoice' | 'income_invoice' | 'receipt' | 'other'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Ke zpracování', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  processing: { label: 'Zpracovává se', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  imported: { label: 'Importováno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Check },
  failed: { label: 'Chyba', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  ignored: { label: 'Ignorováno', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: X },
}

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'bank_statement', label: 'Bankovní výpis' },
  { value: 'expense_invoice', label: 'Přijatá faktura (výdaj)' },
  { value: 'income_invoice', label: 'Vydaná faktura (příjem)' },
  { value: 'receipt', label: 'Pokladní doklad' },
  { value: 'other', label: 'Ostatní' },
]

type InboxItem = DocumentInboxItem & { company_name?: string }

export default function ClientInboxPage() {
  const { company, companyId } = useCompany()
  const [items, setItems] = useState<InboxItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'imported' | 'all'>('pending')
  const [refreshing, setRefreshing] = useState(false)

  // Process dialog state
  const [processItem, setProcessItem] = useState<InboxItem | null>(null)
  const [processDocType, setProcessDocType] = useState<DocumentType>('expense_invoice')
  const [processPeriod, setProcessPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [processExtract, setProcessExtract] = useState(true)
  const [processing, setProcessing] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const statusParam = tab === 'all' ? '' : `&status=${tab}`
      const res = await fetch(`/api/accountant/inbox?companyId=${companyId}${statusParam}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.items || [])
      setPendingCount(data.pendingCount || 0)
    } catch (err) {
      console.error('Inbox fetch error:', err)
      toast.error('Nepodařilo se načíst inbox')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [companyId, tab])

  useEffect(() => {
    setLoading(true)
    fetchItems()
  }, [fetchItems])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchItems()
  }

  const handleProcess = async () => {
    if (!processItem) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/accountant/inbox/${processItem.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: processDocType,
          period: processPeriod,
          extract: processExtract,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Processing failed')
      }
      toast.success(`${processItem.filename} importován`)
      setProcessItem(null)
      fetchItems()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při zpracování')
    } finally {
      setProcessing(false)
    }
  }

  const handleIgnore = async (item: InboxItem) => {
    try {
      const res = await fetch(`/api/accountant/inbox/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      })
      if (!res.ok) throw new Error('Failed to ignore')
      toast.success('Položka ignorována')
      fetchItems()
    } catch {
      toast.error('Nepodařilo se ignorovat položku')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const tabs = [
    { key: 'pending' as const, label: 'Ke zpracování', count: pendingCount },
    { key: 'imported' as const, label: 'Importované', count: null },
    { key: 'all' as const, label: 'Vše', count: null },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Inbox className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold font-display text-gray-900 dark:text-white">
              Inbox dokladů
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Doklady přijaté emailem pro {company.name}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Obnovit
        </Button>
      </div>

      {/* Collection email placeholder */}
      <Card className="rounded-xl shadow-soft border-0">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Mail className="h-4 w-4" />
            <span>Sběrný email pro tuto firmu bude dostupný v nastavení.</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-xl text-xs h-8 ${
              tab === t.key
                ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-soft-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span className={`ml-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold rounded-full ${
                tab === t.key ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {t.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="rounded-xl shadow-soft border-0">
          <CardContent className="py-12 text-center">
            <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {tab === 'pending' ? 'Žádné doklady ke zpracování' : 'Žádné doklady v inboxu'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const statusInfo = STATUS_LABELS[item.status] || STATUS_LABELS.pending
            const StatusIcon = statusInfo.icon
            return (
              <Card key={item.id} className="rounded-xl shadow-soft border-0 hover:shadow-soft-md transition-shadow">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    {/* File icon */}
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {item.filename}
                        </span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusInfo.color}`}>
                          <StatusIcon className="h-3 w-3 mr-0.5" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {item.from_address && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {item.from_name || item.from_address}
                          </span>
                        )}
                        {item.subject && (
                          <span className="truncate max-w-[200px]" title={item.subject}>
                            {item.subject}
                          </span>
                        )}
                        <span>{formatFileSize(item.file_size_bytes)}</span>
                        <span>{formatDate(item.received_at || item.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    {item.status === 'pending' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          className="rounded-xl h-8 bg-purple-500 hover:bg-purple-600 text-white"
                          onClick={() => {
                            setProcessItem(item)
                            // Auto-detect doc type from filename
                            const fn = item.filename.toLowerCase()
                            if (fn.includes('výpis') || fn.includes('vypis') || fn.includes('bank')) {
                              setProcessDocType('bank_statement')
                            } else if (fn.includes('faktur') || fn.includes('invoice')) {
                              setProcessDocType('expense_invoice')
                            } else if (fn.includes('pokl') || fn.includes('receipt')) {
                              setProcessDocType('receipt')
                            } else {
                              setProcessDocType('expense_invoice')
                            }
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" />
                          Zpracovat
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl h-8 text-gray-400 hover:text-red-500"
                          onClick={() => handleIgnore(item)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    {item.status === 'imported' && item.document_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-8 text-gray-400 hover:text-purple-600"
                        onClick={() => {
                          // Could link to document detail
                          toast.info('Doklad byl importován')
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Process Dialog */}
      {processItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !processing && setProcessItem(null)}>
          <Card className="w-full max-w-md mx-4 rounded-2xl shadow-2xl border-0" onClick={e => e.stopPropagation()}>
            <CardContent className="pt-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Zpracovat doklad
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
                {processItem.filename}
              </p>

              <div className="space-y-4">
                {/* Document type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Typ dokladu
                  </label>
                  <select
                    value={processDocType}
                    onChange={e => setProcessDocType(e.target.value as DocumentType)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {DOC_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Období
                  </label>
                  <input
                    type="month"
                    value={processPeriod}
                    onChange={e => setProcessPeriod(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Extract checkbox */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={processExtract}
                    onChange={e => setProcessExtract(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Automaticky vytěžit (OCR + AI)
                  </span>
                </label>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setProcessItem(null)}
                  disabled={processing}
                >
                  Zrušit
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={handleProcess}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                      Zpracovávám...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Importovat
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
