'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Inbox,
  RefreshCw,
  FileText,
  Paperclip,
  Check,
  X,
  Eye,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

// Types
type InboxItem = {
  id: string
  company_id: string
  company_name: string
  from_address: string | null
  from_name: string | null
  subject: string | null
  filename: string
  mime_type: string
  file_size_bytes: number
  status: 'pending' | 'processing' | 'imported' | 'failed' | 'ignored'
  received_at: string | null
  created_at: string
  error_message: string | null
  document_id: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Nový', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  processing: { label: 'Zpracovává se', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  imported: { label: 'Importováno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Check },
  failed: { label: 'Chyba', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  ignored: { label: 'Ignorováno', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: X },
}

const DOCUMENT_TYPES = [
  { value: 'bank_statement', label: 'Bankovní výpis' },
  { value: 'expense_invoice', label: 'Výdajová faktura' },
  { value: 'income_invoice', label: 'Příjmová faktura' },
  { value: 'receipt', label: 'Účtenka' },
  { value: 'other', label: 'Ostatní' },
]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[i]}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Právě teď'
  if (diffMin < 60) return `před ${diffMin} min`
  if (diffH < 24) return `před ${diffH} h`
  if (diffD < 7) return `před ${diffD} dny`
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}

function getMimeLabel(mime: string): string {
  if (mime.includes('pdf')) return 'PDF'
  if (mime.includes('image')) return 'Obrázek'
  if (mime.includes('xml')) return 'XML'
  if (mime.includes('zip') || mime.includes('rar')) return 'Archiv'
  if (mime.includes('word') || mime.includes('docx')) return 'Word'
  if (mime.includes('excel') || mime.includes('sheet') || mime.includes('xlsx')) return 'Excel'
  return mime.split('/').pop()?.toUpperCase() || 'Soubor'
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('all')

  // Process dialog state
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [shouldExtract, setShouldExtract] = useState(true)
  const [processing, setProcessing] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/accountant/inbox${params}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      // silent
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/accountant/inbox/sync', { method: 'POST' })
      const data = await res.json()
      toast.success(`Synchronizace dokončena: ${data.fetched || 0} nových položek`)
      fetchItems()
    } catch {
      toast.error('Chyba při synchronizaci')
    } finally {
      setSyncing(false)
    }
  }

  const handleIgnore = async (itemId: string) => {
    try {
      await fetch(`/api/accountant/inbox/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      })
      toast.success('Položka ignorována')
      fetchItems()
    } catch {
      toast.error('Chyba při ignorování')
    }
  }

  const openProcessDialog = (item: InboxItem) => {
    setSelectedItem(item)
    setDocumentType('')
    setPeriod('')
    setShouldExtract(true)
    setProcessDialogOpen(true)
  }

  const handleProcess = async () => {
    if (!selectedItem || !documentType) {
      toast.error('Vyberte typ dokumentu')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/accountant/inbox/${selectedItem.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: documentType,
          period: period || undefined,
          extract: shouldExtract,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Chyba zpracování')
      }
      toast.success('Dokument zpracován')
      setProcessDialogOpen(false)
      setSelectedItem(null)
      fetchItems()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chyba při zpracování'
      toast.error(message)
    } finally {
      setProcessing(false)
    }
  }

  const tabCounts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    imported: items.filter(i => i.status === 'imported').length,
    ignored: items.filter(i => i.status === 'ignored').length,
    failed: items.filter(i => i.status === 'failed').length,
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Inbox className="h-6 w-6" /> Inbox dokladů
        </h1>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronizace...' : 'Synchronizovat'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Vše</TabsTrigger>
          <TabsTrigger value="pending">
            Nové
            {tabCounts.pending > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                {tabCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="imported">Zpracované</TabsTrigger>
          <TabsTrigger value="ignored">Ignorované</TabsTrigger>
          <TabsTrigger value="failed">
            Chybné
            {tabCounts.failed > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                {tabCounts.failed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            /* Loading skeleton */
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Card key={i} className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="animate-pulse flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                      <div className="h-8 w-24 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <Card className="rounded-xl shadow-soft">
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Žádné položky v této kategorii</p>
              </CardContent>
            </Card>
          ) : (
            /* Item list */
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {items.map(item => {
                  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
                  const StatusIcon = statusCfg.icon
                  return (
                    <Card key={item.id} className="rounded-xl shadow-soft-sm hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className="mt-0.5 shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{item.filename}</span>
                              <Badge className={`${statusCfg.color} text-xs rounded-md`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusCfg.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs rounded-md">
                                {getMimeLabel(item.mime_type)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(item.file_size_bytes)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">{item.company_name}</span>
                              {item.from_address && (
                                <>
                                  <span className="text-muted-foreground/50">|</span>
                                  <span className="truncate">{item.from_name || item.from_address}</span>
                                </>
                              )}
                            </div>

                            {item.subject && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {item.subject}
                              </p>
                            )}

                            {item.error_message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                                {item.error_message}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{formatDate(item.received_at || item.created_at)}</span>
                              {item.document_id && (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <Check className="h-3 w-3" /> Dokument vytvořen
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            {item.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openProcessDialog(item)}
                                >
                                  <ArrowRight className="h-3.5 w-3.5 mr-1" /> Zpracovat
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleIgnore(item.id)}
                                >
                                  Ignorovat
                                </Button>
                              </>
                            )}
                            {item.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProcessDialog(item)}
                              >
                                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Znovu
                              </Button>
                            )}
                            {item.status === 'ignored' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openProcessDialog(item)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Zpracovat
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={(open) => {
        setProcessDialogOpen(open)
        if (!open) setSelectedItem(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zpracovat dokument</DialogTitle>
            <DialogDescription>
              {selectedItem?.filename}
              {selectedItem?.company_name && ` — ${selectedItem.company_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Document type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Typ dokumentu</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte typ dokumentu" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(dt => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Období</label>
              <input
                type="month"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background dark:bg-gray-800 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                placeholder="YYYY-MM"
              />
            </div>

            {/* Extract checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="should-extract"
                checked={shouldExtract}
                onCheckedChange={(checked) => setShouldExtract(checked === true)}
              />
              <label htmlFor="should-extract" className="text-sm cursor-pointer">
                Vytěžit dokument (AI extrakce dat)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)} disabled={processing}>
              Zrušit
            </Button>
            <Button onClick={handleProcess} disabled={processing || !documentType}>
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Zpracovávám...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Zpracovat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
