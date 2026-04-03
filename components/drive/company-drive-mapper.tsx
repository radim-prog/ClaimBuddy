'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  HardDrive,
  Loader2,
  Search,
  RefreshCw,
  Link2,
  Unlink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  PlugZap,
  Wifi,
  WifiOff,
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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import type { DriveCompanyMapping, DriveSyncState } from '@/lib/types/drive'

type SyncStatus = DriveSyncState['sync_status'] | null

// Mapping row with UI-only fields
type MappingRow = DriveCompanyMapping & {
  _syncing?: boolean
}

function getSyncBadge(status: SyncStatus) {
  switch (status) {
    case 'synced':
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Synchronizováno
        </Badge>
      )
    case 'syncing':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
          <Activity className="h-3 w-3 mr-1 animate-pulse" />
          Synchronizace...
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
    default:
      return (
        <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700">
          <Clock className="h-3 w-3 mr-1" />
          Nikdy
        </Badge>
      )
  }
}

function formatSyncDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

export function CompanyDriveMapper() {
  const { firmId } = useAccountantUser()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [mappings, setMappings] = useState<MappingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Drive connection state
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null)
  const [driveEmail, setDriveEmail] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  // Map dialog state
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState<MappingRow | null>(null)
  const [driveFolderId, setDriveFolderId] = useState('')
  const [mapping, setMapping] = useState(false)

  // Disconnect dialog state
  const [disconnectTarget, setDisconnectTarget] = useState<MappingRow | null>(null)

  // Handle OAuth callback params
  useEffect(() => {
    const success = searchParams.get('drive_success')
    const driveError = searchParams.get('drive_error')
    if (success) {
      toast.success(success)
      router.replace('/accountant/admin/operations', { scroll: false })
    } else if (driveError) {
      toast.error(driveError)
      router.replace('/accountant/admin/operations', { scroll: false })
    }
  }, [searchParams, router])

  // Check Drive connection status
  useEffect(() => {
    if (!firmId) return
    fetch(`/api/drive/connection-status?firmId=${firmId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDriveConnected(data.connected)
          setDriveEmail(data.email || null)
        }
      })
      .catch(() => { /* ignore */ })
  }, [firmId, searchParams])

  const handleConnectDrive = () => {
    if (!firmId) {
      toast.error('Firma není nastavena')
      return
    }
    setConnecting(true)
    window.location.href = `/api/auth/google/drive?firmId=${firmId}`
  }

  const fetchMappings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/drive/map-company')
      if (!res.ok) {
        throw new Error('Nepodařilo se načíst mapování')
      }
      const data = await res.json()
      const list: DriveCompanyMapping[] = Array.isArray(data)
        ? data
        : data.mappings ?? []
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

  // Filter by search
  const filtered = mappings.filter((m) =>
    m.company_name.toLowerCase().includes(search.toLowerCase())
  )

  const mapped = filtered.filter((m) => m.google_drive_folder_id)
  const unmapped = filtered.filter((m) => !m.google_drive_folder_id)

  // -- Handlers --

  const openMapDialog = (row: MappingRow) => {
    setMapTarget(row)
    setDriveFolderId('')
    setMapDialogOpen(true)
  }

  const handleMap = async () => {
    if (!mapTarget || !driveFolderId.trim()) {
      toast.error('Zadejte ID složky Google Drive')
      return
    }

    setMapping(true)

    try {
      const res = await fetch('/api/drive/map-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: mapTarget.company_id,
          driveFolderId: driveFolderId.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se propojit')
      }

      toast.success(`Firma "${mapTarget.company_name}" byla propojena s Google Drive`)
      setMapDialogOpen(false)
      setMapTarget(null)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se propojit')
    } finally {
      setMapping(false)
    }
  }

  const handleSync = async (row: MappingRow) => {
    // Mark as syncing in UI
    setMappings((prev) =>
      prev.map((m) =>
        m.company_id === row.company_id ? { ...m, _syncing: true, sync_status: 'syncing' as SyncStatus } : m
      )
    )

    try {
      const res = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: row.company_id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Synchronizace se nezdařila')
      }

      toast.success(`Synchronizace firmy "${row.company_name}" dokončena`)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Synchronizace se nezdařila')
      // Revert syncing state
      setMappings((prev) =>
        prev.map((m) =>
          m.company_id === row.company_id ? { ...m, _syncing: false, sync_status: 'error' as SyncStatus } : m
        )
      )
    }
  }

  const handleDisconnect = async () => {
    if (!disconnectTarget) return

    try {
      const res = await fetch('/api/drive/map-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: disconnectTarget.company_id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se odpojit')
      }

      toast.success(`Firma "${disconnectTarget.company_name}" byla odpojena`)
      setDisconnectTarget(null)
      fetchMappings()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Nepodařilo se odpojit')
    }
  }

  // -- Render --

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-purple-600" />
            Propojení firem s Google Drive
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Spravujte mapování firemních složek na Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Drive connection status */}
          {driveConnected === true ? (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
              <Wifi className="h-3 w-3" />
              {driveEmail || 'Připojeno'}
            </Badge>
          ) : driveConnected === false ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectDrive}
              disabled={connecting}
              className="h-8 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/20"
            >
              {connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" />
              )}
              Připojit Google Drive
            </Button>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat firmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[240px]"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchMappings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Celkem: <span className="font-medium text-foreground">{mappings.length}</span>
          </span>
          <span>
            Propojeno: <span className="font-medium text-green-600 dark:text-green-400">{mapped.length + unmapped.length - unmapped.length}</span>
          </span>
          <span>
            Nepropojeno: <span className="font-medium text-gray-500">{unmapped.length}</span>
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
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
          <HardDrive className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Žádné firmy neodpovídají hledání' : 'Žádné firmy k dispozici'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Firma</TableHead>
                <TableHead className="hidden md:table-cell">Drive Folder ID</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead className="hidden lg:table-cell">Poslední sync</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Souborů</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const isMapped = !!row.google_drive_folder_id
                const isSyncing = row._syncing || row.sync_status === 'syncing'

                return (
                  <TableRow key={row.company_id}>
                    {/* Company Name */}
                    <TableCell className="font-medium">{row.company_name}</TableCell>

                    {/* Drive Folder ID */}
                    <TableCell className="hidden md:table-cell">
                      {isMapped ? (
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono max-w-[200px] truncate inline-block">
                          {row.google_drive_folder_id}
                        </code>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {isMapped ? getSyncBadge(row.sync_status) : getSyncBadge(null)}
                    </TableCell>

                    {/* Last Sync */}
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatSyncDate(row.last_sync_at)}
                    </TableCell>

                    {/* File Count */}
                    <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                      {row.total_files > 0 ? row.total_files : '-'}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isMapped ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(row)}
                              disabled={isSyncing}
                              className="h-8"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                              Sync
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDisconnectTarget(row)}
                              className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Unlink className="h-3.5 w-3.5 mr-1" />
                              Odpojit
                            </Button>
                          </>
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

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-600" />
              Propojit s Google Drive
            </DialogTitle>
            <DialogDescription>
              Zadejte ID složky na Google Drive pro firmu{' '}
              <span className="font-semibold">{mapTarget?.company_name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="drive-folder-id">Google Drive Folder ID *</Label>
              <Input
                id="drive-folder-id"
                value={driveFolderId}
                onChange={(e) => setDriveFolderId(e.target.value)}
                placeholder="Např. 1A2B3C4D5E6F7G8H9I0J"
                disabled={mapping}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                ID najdete v URL sdílené složky Google Drive po /folders/
              </p>
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
            <Button
              onClick={handleMap}
              disabled={mapping || !driveFolderId.trim()}
            >
              {mapping ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Propojuji...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1.5" />
                  Propojit
                </>
              )}
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
              od Google Drive? Soubory na Drive zůstanou nedotčeny.
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
