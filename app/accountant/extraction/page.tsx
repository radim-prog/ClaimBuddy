'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Check,
  X,
  Eye,
  ArrowRight,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Timer,
  CheckCircle2,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useExtractionMode } from '@/lib/contexts/extraction-mode-context'

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

type ClientGroup = {
  companyId: string
  companyName: string
  items: InboxItem[]
  pendingCount: number
  totalCount: number
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

export default function ExtractionInboxPage() {
  const { advanced } = useExtractionMode()
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('pending')

  // Collapsed client groups
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())

  // Time tracking per client
  const [timeMinutes, setTimeMinutes] = useState<Record<string, string>>({})
  const [savingTime, setSavingTime] = useState<Record<string, boolean>>({})

  // Completing client
  const [completingClient, setCompletingClient] = useState<string | null>(null)

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
      // For 'pending' tab, fetch pending + processing + failed
      // For other tabs, fetch that specific status
      const statusParam = filter === 'pending' ? '' : `?status=${filter}`
      const res = await fetch(`/api/accountant/inbox${statusParam}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      // silent
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchItems() }, [fetchItems])

  // Group items by client
  const clientGroups: ClientGroup[] = useMemo(() => {
    const groupMap = new Map<string, ClientGroup>()

    const filteredItems = filter === 'pending'
      ? items.filter(i => i.status === 'pending' || i.status === 'processing' || i.status === 'failed')
      : items

    for (const item of filteredItems) {
      const existing = groupMap.get(item.company_id)
      if (existing) {
        existing.items.push(item)
        if (item.status === 'pending') existing.pendingCount++
        existing.totalCount++
      } else {
        groupMap.set(item.company_id, {
          companyId: item.company_id,
          companyName: item.company_name,
          items: [item],
          pendingCount: item.status === 'pending' ? 1 : 0,
          totalCount: 1,
        })
      }
    }

    // Sort: clients with most pending items first
    return Array.from(groupMap.values()).sort((a, b) => b.pendingCount - a.pendingCount || a.companyName.localeCompare(b.companyName, 'cs'))
  }, [items, filter])

  const totalPending = useMemo(() => items.filter(i => i.status === 'pending').length, [items])
  const totalFailed = useMemo(() => items.filter(i => i.status === 'failed').length, [items])

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

  const toggleClientCollapse = (companyId: string) => {
    setCollapsedClients(prev => {
      const next = new Set(prev)
      if (next.has(companyId)) next.delete(companyId)
      else next.add(companyId)
      return next
    })
  }

  // Save time entry for a client
  const handleSaveTime = async (companyId: string, companyName: string) => {
    const mins = parseInt(timeMinutes[companyId] || '0', 10)
    if (!mins || mins <= 0) {
      toast.error('Zadejte počet minut')
      return
    }
    setSavingTime(prev => ({ ...prev, [companyId]: true }))
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          date: today,
          minutes: mins,
          description: `Zpracování dokladů z inboxu — ${companyName}`,
          billable: true,
        }),
      })
      if (!res.ok) throw new Error('Chyba')
      toast.success(`${mins} min zaznamenáno pro ${companyName}`)
      setTimeMinutes(prev => ({ ...prev, [companyId]: '' }))
    } catch {
      toast.error('Chyba při ukládání času')
    } finally {
      setSavingTime(prev => ({ ...prev, [companyId]: false }))
    }
  }

  // Mark all client items as done (imported → moved out of inbox view)
  const handleCompleteClient = async (group: ClientGroup) => {
    const pendingItems = group.items.filter(i => i.status === 'pending' || i.status === 'failed')
    if (pendingItems.length > 0) {
      toast.error(`${group.companyName}: Ještě máte ${pendingItems.length} nezpracovaných položek`)
      return
    }
    setCompletingClient(group.companyId)
    try {
      // Mark all imported/processing items as "completed" (ignored with completed flag)
      const itemsToComplete = group.items.filter(i => i.status === 'imported' || i.status === 'processing')
      await Promise.all(
        itemsToComplete.map(item =>
          fetch(`/api/accountant/inbox/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ignored', completed: true }),
          })
        )
      )
      toast.success(`${group.companyName}: Klient dokončen`)
      fetchItems()
    } catch {
      toast.error('Chyba při dokončování')
    } finally {
      setCompletingClient(null)
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Compact toolbar (layout provides page title) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Seskupeno podle klientů &middot; {clientGroups.length} klientů
        </p>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronizace...' : 'Synchronizovat'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">
            K zpracování
            {totalPending > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                {totalPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="imported">{advanced ? 'Zpracované' : 'Hotovo'}</TabsTrigger>
          <TabsTrigger value="failed">
            Chybné
            {totalFailed > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs">
                {totalFailed}
              </Badge>
            )}
          </TabsTrigger>
          {advanced && <TabsTrigger value="ignored">Ignorované</TabsTrigger>}
          {advanced && <TabsTrigger value="all">Vše</TabsTrigger>}
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="rounded-xl shadow-soft-sm">
                  <CardContent className="p-4">
                    <div className="animate-pulse flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : clientGroups.length === 0 ? (
            <Card className="rounded-xl shadow-soft">
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Žádné položky v této kategorii</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[700px]">
              <div className="space-y-3">
                {clientGroups.map(group => {
                  const isCollapsed = collapsedClients.has(group.companyId)
                  return (
                    <Card key={group.companyId} className="rounded-xl shadow-soft-sm overflow-hidden">
                      {/* Client header */}
                      <button
                        onClick={() => toggleClientCollapse(group.companyId)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="font-semibold text-sm flex-1">{group.companyName}</span>
                        {group.pendingCount > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                            {group.pendingCount} nových
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {group.totalCount} dokladů
                        </Badge>
                      </button>

                      {!isCollapsed && (
                        <CardContent className="pt-0 px-4 pb-4">
                          {/* Items */}
                          <div className="space-y-1.5 mb-3">
                            {group.items.map(item => {
                              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
                              const StatusIcon = statusCfg.icon
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">{item.filename}</span>
                                      <Badge className={`${statusCfg.color} text-xs rounded-md`}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {statusCfg.label}
                                      </Badge>
                                      {advanced && (
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                          {getMimeLabel(item.mime_type)} &middot; {formatFileSize(item.file_size_bytes)}
                                        </span>
                                      )}
                                    </div>
                                    {advanced && item.subject && (
                                      <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subject}</p>
                                    )}
                                    {item.error_message && (
                                      <p className="text-xs text-red-600 dark:text-red-400 truncate mt-0.5">{item.error_message}</p>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(item.received_at || item.created_at)}
                                      {advanced && item.from_name && ` · ${item.from_name}`}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex gap-1 shrink-0">
                                    {item.status === 'pending' && (
                                      <>
                                        <Button size="sm" onClick={() => openProcessDialog(item)}>
                                          <ArrowRight className="h-3.5 w-3.5 mr-1" /> Zpracovat
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleIgnore(item.id)}>
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      </>
                                    )}
                                    {item.status === 'failed' && (
                                      <Button variant="outline" size="sm" onClick={() => openProcessDialog(item)}>
                                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Znovu
                                      </Button>
                                    )}
                                    {item.status === 'ignored' && (
                                      <Button variant="ghost" size="sm" onClick={() => openProcessDialog(item)}>
                                        <Eye className="h-3.5 w-3.5 mr-1" /> Zpracovat
                                      </Button>
                                    )}
                                    {item.document_id && (
                                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                                        <Check className="h-3 w-3 mr-0.5" /> OK
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Client footer: time tracking + complete (advanced only) */}
                          {advanced && (
                            <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                              {/* Time tracking */}
                              <div className="flex items-center gap-1.5">
                                <Timer className="h-4 w-4 text-muted-foreground" />
                                <input
                                  type="number"
                                  min="1"
                                  placeholder="min"
                                  value={timeMinutes[group.companyId] || ''}
                                  onChange={(e) => setTimeMinutes(prev => ({ ...prev, [group.companyId]: e.target.value }))}
                                  className="w-16 h-8 rounded-md border border-input bg-background px-2 text-sm text-center"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={savingTime[group.companyId] || !timeMinutes[group.companyId]}
                                  onClick={() => handleSaveTime(group.companyId, group.companyName)}
                                >
                                  {savingTime[group.companyId] ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Zapsat čas'}
                                </Button>
                              </div>

                              <div className="flex-1" />

                              {/* Link to client profile */}
                              <Link
                                href={`/accountant/clients/${group.companyId}/inbox`}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                              >
                                Profil klienta
                              </Link>

                              {/* Complete button */}
                              {filter === 'pending' && (
                                <Button
                                  variant={group.pendingCount === 0 ? 'default' : 'outline'}
                                  size="sm"
                                  className={group.pendingCount === 0 ? 'bg-green-600 hover:bg-green-700' : ''}
                                  disabled={completingClient === group.companyId}
                                  onClick={() => handleCompleteClient(group)}
                                >
                                  {completingClient === group.companyId ? (
                                    <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  Dokončeno
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
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
