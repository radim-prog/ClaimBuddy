'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

type GroupData = {
  group_name: string
  billing_company_id: string | null
}

// A display unit: either a standalone company or a group
type DisplayUnit = {
  type: 'standalone'
  mapping: RaynetMapping
} | {
  type: 'group'
  groupName: string
  billingMapping: RaynetMapping
  members: RaynetMapping[]
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
  const [groups, setGroups] = useState<GroupData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Map dialog state
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState<{ type: 'company' | 'group'; companyId?: string; groupName?: string; displayName: string } | null>(null)
  const [raynetSearch, setRaynetSearch] = useState('')
  const [raynetCompanies, setRaynetCompanies] = useState<RaynetCompanyOption[]>([])
  const [raynetLoading, setRaynetLoading] = useState(false)
  const [mapping, setMapping] = useState(false)

  // Disconnect dialog state
  const [disconnectTarget, setDisconnectTarget] = useState<{ type: 'company' | 'group'; companyId?: string; groupName?: string; displayName: string } | null>(null)

  // Collapse state for groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

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
      setGroups(data.groups ?? [])
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

  // Build display units: groups + standalone companies
  const displayUnits = useMemo((): DisplayUnit[] => {
    const groupMap = new Map<string, GroupData>()
    for (const g of groups) {
      groupMap.set(g.group_name, g)
    }

    // Group mappings by group_name
    const grouped = new Map<string, RaynetMapping[]>()
    const standalone: RaynetMapping[] = []

    for (const m of mappings) {
      if (m.group_name) {
        const arr = grouped.get(m.group_name) || []
        arr.push(m)
        grouped.set(m.group_name, arr)
      } else {
        standalone.push(m)
      }
    }

    const units: DisplayUnit[] = []

    // Add groups
    for (const [groupName, members] of grouped) {
      const gData = groupMap.get(groupName)
      const billingId = gData?.billing_company_id
      const billingMapping = (billingId ? members.find(m => m.company_id === billingId) : null) || members[0]

      units.push({
        type: 'group',
        groupName,
        billingMapping,
        members: members.sort((a, b) => a.company_name.localeCompare(b.company_name, 'cs')),
      })
    }

    // Add standalone
    for (const m of standalone) {
      units.push({ type: 'standalone', mapping: m })
    }

    // Sort: groups by name, standalone by name, intermixed alphabetically
    units.sort((a, b) => {
      const aName = a.type === 'group' ? a.groupName : a.mapping.company_name
      const bName = b.type === 'group' ? b.groupName : b.mapping.company_name
      return aName.localeCompare(bName, 'cs')
    })

    return units
  }, [mappings, groups])

  // Filter by search
  const filteredUnits = useMemo(() => {
    if (!search) return displayUnits
    const q = search.toLowerCase()
    return displayUnits.filter(unit => {
      if (unit.type === 'standalone') {
        return unit.mapping.company_name.toLowerCase().includes(q)
      }
      // Group: match on group name or any member
      return unit.groupName.toLowerCase().includes(q) ||
        unit.members.some(m => m.company_name.toLowerCase().includes(q))
    })
  }, [displayUnits, search])

  // Stats
  const stats = useMemo(() => {
    let totalUnits = 0
    let mapped = 0
    let unmapped = 0

    for (const unit of filteredUnits) {
      totalUnits++
      if (unit.type === 'standalone') {
        if (unit.mapping.raynet_company_id) mapped++
        else unmapped++
      } else {
        // Group counts as 1 unit
        if (unit.billingMapping.raynet_company_id) mapped++
        else unmapped++
      }
    }

    return { total: totalUnits, mapped, unmapped }
  }, [filteredUnits])

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

  // -- Handlers --

  const openMapDialog = (target: typeof mapTarget) => {
    if (!target) return
    setMapTarget(target)
    setRaynetSearch(target.displayName)
    setRaynetCompanies([])
    setMapDialogOpen(true)
  }

  const handleMap = async (raynetCompany: RaynetCompanyOption) => {
    if (!mapTarget) return
    setMapping(true)

    try {
      const body: Record<string, any> = {
        raynetCompanyId: raynetCompany.id,
        raynetCompanyName: raynetCompany.name,
      }
      if (mapTarget.type === 'group') {
        body.groupName = mapTarget.groupName
      } else {
        body.companyId = mapTarget.companyId
      }

      const res = await fetch('/api/raynet/map-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se propojit')
      }

      toast.success(`"${mapTarget.displayName}" propojeno s "${raynetCompany.name}"`)
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
      const body: Record<string, any> = {}
      if (disconnectTarget.type === 'group') {
        body.groupName = disconnectTarget.groupName
      } else {
        body.companyId = disconnectTarget.companyId
      }

      const res = await fetch('/api/raynet/map-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se odpojit')
      }

      toast.success(`"${disconnectTarget.displayName}" byla odpojena z Raynetu`)
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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupName)) next.delete(groupName)
      else next.add(groupName)
      return next
    })
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
            Celkem: <span className="font-medium text-foreground">{stats.total}</span>
          </span>
          <span>
            Propojeno: <span className="font-medium text-green-600 dark:text-green-400">{stats.mapped}</span>
          </span>
          <span>
            Nepropojeno: <span className="font-medium text-gray-500">{stats.unmapped}</span>
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
      ) : filteredUnits.length === 0 ? (
        <div className="text-center py-12">
          <Link2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Žádné firmy neodpovídají hledání' : 'Žádné firmy k dispozici'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b text-sm text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Firma / Skupina</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Raynet firma</th>
                <th className="px-4 py-3 text-left font-medium">Stav</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Poslední sync</th>
                <th className="px-4 py-3 text-right font-medium">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUnits.map((unit) => {
                if (unit.type === 'standalone') {
                  const row = unit.mapping
                  const isMapped = !!row.raynet_company_id
                  return (
                    <tr key={row.company_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-medium text-sm">{row.company_name}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
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
                      </td>
                      <td className="px-4 py-3">
                        {isMapped ? getSyncBadge(row.sync_status) : getSyncBadge(null)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {formatSyncDate(row.last_sync_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMapped ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisconnectTarget({ type: 'company', companyId: row.company_id, displayName: row.company_name })}
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Unlink className="h-3.5 w-3.5 mr-1" />
                            Odpojit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openMapDialog({ type: 'company', companyId: row.company_id, displayName: row.company_name })}
                            className="h-8"
                          >
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Mapovat
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                }

                // Group
                const { groupName, billingMapping, members } = unit
                const isMapped = !!billingMapping.raynet_company_id
                const isExpanded = expandedGroups.has(groupName)

                // Best sync status from group
                const bestSync = members.find(m => m.sync_status === 'synced')?.sync_status
                  || members.find(m => m.sync_status === 'error')?.sync_status
                  || members.find(m => m.sync_status === 'never_synced')?.sync_status
                  || null

                const latestSyncDate = members.reduce<string | null>((latest, m) => {
                  if (!m.last_sync_at) return latest
                  if (!latest) return m.last_sync_at
                  return m.last_sync_at > latest ? m.last_sync_at : latest
                }, null)

                return (
                  <tbody key={groupName}>
                    {/* Group header row */}
                    <tr className="bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleGroup(groupName)}
                          className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 select-none"
                        >
                          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          {groupName}
                          <span className="text-[10px] font-normal text-purple-500 dark:text-purple-400">
                            ({members.length} firem)
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {isMapped ? (
                          <span className="text-sm flex items-center gap-1.5">
                            {billingMapping.raynet_company_name || `ID: ${billingMapping.raynet_company_id}`}
                            <a
                              href={`https://app.raynet.cz/app/company/${billingMapping.raynet_company_id}/`}
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
                      </td>
                      <td className="px-4 py-3">
                        {isMapped ? getSyncBadge(bestSync) : getSyncBadge(null)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {formatSyncDate(latestSyncDate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMapped ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisconnectTarget({ type: 'group', groupName, displayName: groupName })}
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Unlink className="h-3.5 w-3.5 mr-1" />
                            Odpojit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openMapDialog({ type: 'group', groupName, displayName: groupName })}
                            className="h-8"
                          >
                            <Link2 className="h-3.5 w-3.5 mr-1" />
                            Mapovat
                          </Button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded: show member rows (read-only) */}
                    {isExpanded && members.map(m => (
                      <tr key={m.company_id} className="bg-gray-50/50 dark:bg-gray-800/30">
                        <td className="px-4 py-2 pl-10 text-sm text-muted-foreground">
                          <span className="text-gray-400 mr-1.5">├</span>
                          {m.company_name}
                        </td>
                        <td className="px-4 py-2 hidden md:table-cell text-sm text-muted-foreground">
                          {m.raynet_company_id ? `ID: ${m.raynet_company_id}` : '—'}
                        </td>
                        <td className="px-4 py-2">
                          {m.raynet_company_id ? getSyncBadge(m.sync_status) : getSyncBadge(null)}
                        </td>
                        <td className="px-4 py-2 hidden lg:table-cell text-sm text-muted-foreground">
                          {formatSyncDate(m.last_sync_at)}
                        </td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    ))}
                  </tbody>
                )
              })}
            </tbody>
          </table>
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
              {mapTarget?.type === 'group' ? (
                <>Propojit skupinu <span className="font-semibold">{mapTarget?.displayName}</span> — všechny firmy ve skupině dostanou stejné propojení</>
              ) : (
                <>Vyberte firmu z Raynetu pro <span className="font-semibold">{mapTarget?.displayName}</span></>
              )}
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
              {disconnectTarget?.type === 'group' ? 'Odpojit skupinu' : 'Odpojit firmu'}
            </DialogTitle>
            <DialogDescription>
              {disconnectTarget?.type === 'group' ? (
                <>Opravdu chcete odpojit celou skupinu <span className="font-semibold">{disconnectTarget?.displayName}</span> od Raynet CRM? Propojení plateb přestane fungovat pro všechny firmy ve skupině.</>
              ) : (
                <>Opravdu chcete odpojit firmu <span className="font-semibold">{disconnectTarget?.displayName}</span> od Raynet CRM? Propojení plateb přestane fungovat.</>
              )}
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
