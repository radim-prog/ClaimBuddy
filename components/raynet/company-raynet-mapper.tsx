'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Link2,
  Loader2,
  Search,
  RefreshCw,
  Unlink,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { RaynetMapping } from '@/lib/types/raynet'

type SyncStatus = RaynetMapping['sync_status']

type RaynetCompanyOption = {
  id: number
  name: string
  regNumber: string | null
}

function getSyncBadge(status: SyncStatus) {
  switch (status) {
    case 'synced':
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Synced
        </Badge>
      )
    case 'error':
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Chyba
        </Badge>
      )
    case 'never_synced':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Čeká
        </Badge>
      )
    default:
      return (
        <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700">
          <Clock className="h-3 w-3 mr-1" />
          —
        </Badge>
      )
  }
}

function formatSyncDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function CompanyRaynetMapper() {
  const [mappings, setMappings] = useState<RaynetMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Map dialog state
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState<RaynetMapping | null>(null)
  const [raynetSearch, setRaynetSearch] = useState('')
  const [raynetCompanies, setRaynetCompanies] = useState<RaynetCompanyOption[]>([])
  const [raynetLoading, setRaynetLoading] = useState(false)
  const [mapping, setMapping] = useState(false)

  // Disconnect dialog state
  const [disconnectTarget, setDisconnectTarget] = useState<RaynetMapping | null>(null)

  // Sync state
  const [syncing, setSyncing] = useState(false)

  const fetchMappings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/raynet/map-company')
      if (!res.ok) throw new Error('Nepodařilo se načíst mapování')
      const data = await res.json()
      const list: RaynetMapping[] = Array.isArray(data) ? data : data.mappings ?? []
      setMappings(list)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se načíst mapování'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMappings()
  }, [fetchMappings])

  // Search Raynet companies for mapping
  const searchRaynetCompanies = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setRaynetCompanies([])
      return
    }

    setRaynetLoading(true)
    try {
      const res = await fetch(`/api/raynet/companies?search=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Nepodařilo se vyhledat firmy v Raynetu')
      const json = await res.json()
      setRaynetCompanies(
        (json.data || []).map((c: RaynetCompanyOption) => ({
          id: c.id,
          name: c.name,
          regNumber: c.regNumber || null,
        }))
      )
    } catch {
      setRaynetCompanies([])
    } finally {
      setRaynetLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapDialogOpen) {
        searchRaynetCompanies(raynetSearch)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [raynetSearch, mapDialogOpen, searchRaynetCompanies])

  // Filter by search
  const filtered = mappings.filter((m) =>
    m.company_name.toLowerCase().includes(search.toLowerCase())
  )

  const mappedCount = filtered.filter((m) => m.raynet_company_id).length
  const unmappedCount = filtered.filter((m) => !m.raynet_company_id).length

  // -- Handlers --

  const openMapDialog = (row: RaynetMapping) => {
    setMapTarget(row)
    setRaynetSearch(row.company_name)
    setRaynetCompanies([])
    setMapDialogOpen(true)
  }

  const handleMap = async (raynetCompany: RaynetCompanyOption) => {
    if (!mapTarget) return
    setMapping(true)

    try {
      const res = await fetch('/api/raynet/map-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: mapTarget.company_id,
          raynetCompanyId: raynetCompany.id,
          raynetCompanyName: raynetCompany.name,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se propojit')
      }

      toast.success(`"${mapTarget.company_name}" propojeno s "${raynetCompany.name}"`)
      setMapDialogOpen(false)
      setMapTarget(null)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se propojit')
    } finally {
      setMapping(false)
    }
  }

  const handleDisconnect = async () => {
    if (!disconnectTarget) return

    try {
      const res = await fetch('/api/raynet/map-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: disconnectTarget.company_id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se odpojit')
      }

      toast.success(`"${disconnectTarget.company_name}" byla odpojena z Raynetu`)
      setDisconnectTarget(null)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se odpojit')
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/raynet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: new Date().getFullYear() }),
      })

      if (!res.ok) throw new Error('Synchronizace selhala')
      const result = await res.json()
      toast.success(`Sync dokončen: ${result.synced} zpracováno, ${result.updated} aktualizováno`)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronizace selhala')
    } finally {
      setSyncing(false)
    }
  }

  // -- Render --

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Propojení firem s Raynet CRM
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automatický sync každých 5 minut (8:00–20:00)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat firmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[240px]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={syncing}
            className="h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchMappings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Celkem: <span className="font-medium text-foreground">{filtered.length}</span>
          </span>
          <span>
            Propojeno: <span className="font-medium text-green-600 dark:text-green-400">{mappedCount}</span>
          </span>
          <span>
            Nepropojeno: <span className="font-medium text-gray-500">{unmappedCount}</span>
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-muted-foreground">Načítám mapování...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-8 w-8 mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMappings}>
            Zkusit znovu
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Link2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Žádné firmy neodpovídají hledání' : 'Žádné firmy k dispozici'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Firma (naše)</TableHead>
                <TableHead className="hidden md:table-cell">Raynet firma</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead className="hidden lg:table-cell">Poslední sync</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const isMapped = !!row.raynet_company_id

                return (
                  <TableRow key={row.company_id}>
                    <TableCell className="font-medium">{row.company_name}</TableCell>

                    <TableCell className="hidden md:table-cell">
                      {isMapped ? (
                        <span className="text-sm flex items-center gap-1.5">
                          {row.raynet_company_name || `ID: ${row.raynet_company_id}`}
                          <a
                            href={`https://app.raynet.cz/app/company/${row.raynet_company_id}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {isMapped ? getSyncBadge(row.sync_status) : getSyncBadge(null)}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatSyncDate(row.last_sync_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isMapped ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisconnectTarget(row)}
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Unlink className="h-3.5 w-3.5 mr-1" />
                            Odpojit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openMapDialog(row)}
                            className="h-8"
                          >
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Mapovat
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Map Dialog — Search & Select Raynet Company */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600" />
              Propojit s Raynet CRM
            </DialogTitle>
            <DialogDescription>
              Vyberte firmu z Raynetu pro{' '}
              <span className="font-semibold">{mapTarget?.company_name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat v Raynetu (min. 2 znaky)..."
                value={raynetSearch}
                onChange={(e) => setRaynetSearch(e.target.value)}
                className="pl-9"
                autoFocus
                disabled={mapping}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              {raynetLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-muted-foreground">Hledám...</span>
                </div>
              ) : raynetCompanies.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {raynetSearch.length < 2
                    ? 'Zadejte alespoň 2 znaky pro vyhledávání'
                    : 'Žádné firmy nenalezeny'}
                </div>
              ) : (
                <div className="divide-y">
                  {raynetCompanies.map((rc) => (
                    <button
                      key={rc.id}
                      onClick={() => handleMap(rc)}
                      disabled={mapping}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-sm">{rc.name}</div>
                        {rc.regNumber && (
                          <div className="text-xs text-muted-foreground">
                            IČO: {rc.regNumber}
                          </div>
                        )}
                      </div>
                      <Link2 className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMapDialogOpen(false)}
              disabled={mapping}
            >
              Zrušit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={!!disconnectTarget}
        onOpenChange={(open) => { if (!open) setDisconnectTarget(null) }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Unlink className="h-5 w-5" />
              Odpojit firmu
            </DialogTitle>
            <DialogDescription>
              Opravdu chcete odpojit firmu{' '}
              <span className="font-semibold">{disconnectTarget?.company_name}</span>{' '}
              od Raynet CRM? Propojení plateb přestane fungovat.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectTarget(null)}>
              Zrušit
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              <Unlink className="h-4 w-4 mr-1.5" />
              Odpojit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
