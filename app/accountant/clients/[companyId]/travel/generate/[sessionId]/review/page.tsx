'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Check, Loader2, Download, FileText, FileSpreadsheet,
  AlertTriangle, CheckCircle2, XCircle, Pencil, Save, X, Sparkles,
  Gauge, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──

interface Trip {
  id: string
  trip_date: string
  departure_time: string | null
  arrival_time: string | null
  origin: string
  destination: string
  purpose: string
  distance_km: number
  is_round_trip: boolean
  odometer_start: number | null
  odometer_end: number | null
  reimbursement: number | null
  basic_rate_per_km: number | null
  manual_override: boolean
  notes: string | null
  generation_order: number
  travel_vehicles?: { name: string; license_plate: string }
  travel_drivers?: { name: string }
}

interface ValidationIssue {
  type: string
  severity: 'error' | 'warning'
  trip_index: number
  message: string
  auto_fixable: boolean
}

// ── Main Component ──

export default function TravelReviewPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const sessionId = params.sessionId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [sessionStatus, setSessionStatus] = useState('')
  const [validationScore, setValidationScore] = useState<number | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editData, setEditData] = useState<Partial<Trip>>({})

  const apiBase = `/api/accountant/companies/${companyId}/travel/generate/${sessionId}`

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // Load trips
  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`${apiBase}/trips`)
        setTrips(data.trips || [])
        setSessionStatus(data.session_status)
        setValidationScore(data.validation_score)
        setValidationIssues((data.validation_issues || []) as ValidationIssue[])
      } catch {
        toast.error('Nepodarilo se nacist cesty')
        router.push(`/accountant/clients/${companyId}/travel`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase, apiFetch, companyId, router])

  // ── Validation checks (client-side) ──

  const validationResults = useMemo(() => {
    const results: {
      odometerOk: boolean
      weekendTrips: number[]
      excessiveKmDays: string[]
      totalKm: number
      totalReimb: number
    } = {
      odometerOk: true,
      weekendTrips: [],
      excessiveKmDays: [],
      totalKm: 0,
      totalReimb: 0,
    }

    const kmPerDay: Record<string, number> = {}

    for (let i = 0; i < trips.length; i++) {
      const t = trips[i]
      const odoKm = (t.odometer_end || 0) - (t.odometer_start || 0)
      results.totalKm += odoKm
      results.totalReimb += t.reimbursement || 0

      // Check odometer chain
      if (i > 0 && t.odometer_start !== trips[i - 1].odometer_end) {
        results.odometerOk = false
      }

      // Check weekends
      const dow = new Date(t.trip_date).getDay()
      if (dow === 0 || dow === 6) {
        results.weekendTrips.push(i)
      }

      // Check daily km
      kmPerDay[t.trip_date] = (kmPerDay[t.trip_date] || 0) + odoKm
    }

    for (const [date, km] of Object.entries(kmPerDay)) {
      if (km > 800) results.excessiveKmDays.push(date)
    }

    return results
  }, [trips])

  // ── Edit handlers ──

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditData({ ...trips[idx] })
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setEditData({})
  }

  const saveEdit = async () => {
    if (editingIdx === null) return
    setSaving(true)
    try {
      const trip = trips[editingIdx]
      await apiFetch(`${apiBase}/trips`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: trip.id,
          updates: {
            trip_date: editData.trip_date,
            departure_time: editData.departure_time,
            arrival_time: editData.arrival_time,
            origin: editData.origin,
            destination: editData.destination,
            purpose: editData.purpose,
            distance_km: editData.distance_km,
            odometer_start: editData.odometer_start,
            odometer_end: editData.odometer_end,
          },
        }),
      })

      // Update local state
      setTrips(prev => {
        const updated = [...prev]
        updated[editingIdx] = { ...updated[editingIdx], ...editData, manual_override: true }
        return updated
      })
      setEditingIdx(null)
      setEditData({})
      toast.success('Cesta ulozena')
    } catch {
      toast.error('Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  // ── Commit ──

  const handleCommit = async () => {
    if (!confirm('Potvrdit vsechny cesty? Budou ulozeny do knihy jizd.')) return
    setCommitting(true)
    try {
      const data = await apiFetch(`${apiBase}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      toast.success(`Ulozeno ${data.total_trips} cest, ${data.total_km} km`)
      setSessionStatus('reviewed')
    } catch {
      toast.error('Chyba pri potvrzovani')
    } finally {
      setCommitting(false)
    }
  }

  // ── Export ──

  const handleExport = (format: 'pdf' | 'csv') => {
    window.open(`${apiBase}/export?format=${format}`, '_blank')
  }

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // ── Group trips by month for display ──

  const tripsByMonth: Record<string, Trip[]> = {}
  for (const t of trips) {
    const m = t.trip_date.slice(0, 7)
    if (!tripsByMonth[m]) tripsByMonth[m] = []
    tripsByMonth[m].push(t)
  }
  const months = Object.keys(tripsByMonth).sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/accountant/clients/${companyId}/travel`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpet
          </Button>
          <h2 className="text-lg font-semibold font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Review vygenerovanych cest
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          {(sessionStatus === 'generated') && (
            <Button size="sm" onClick={handleCommit} disabled={committing}>
              {committing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Potvrdit vse
            </Button>
          )}
          {sessionStatus === 'reviewed' && (
            <Badge className="bg-green-100 text-green-700">Potvrzeno</Badge>
          )}
        </div>
      </div>

      {/* Validation panel */}
      <Card className="rounded-xl shadow-soft-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display">Validace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <ValidationBadge
              ok={validationResults.odometerOk}
              label="Tachometr chain"
              icon={<Gauge className="h-3.5 w-3.5" />}
            />
            <ValidationBadge
              ok={validationResults.weekendTrips.length === 0}
              label={validationResults.weekendTrips.length === 0 ? 'Zadne vikendy' : `${validationResults.weekendTrips.length} vikendovych`}
              icon={<Calendar className="h-3.5 w-3.5" />}
            />
            <ValidationBadge
              ok={validationResults.excessiveKmDays.length === 0}
              label={validationResults.excessiveKmDays.length === 0 ? 'Max denni km OK' : `${validationResults.excessiveKmDays.length} dnu >800km`}
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
            />
            {validationScore !== null && (
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                validationScore >= 90 ? 'bg-green-100 text-green-700' :
                  validationScore >= 70 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
              )}>
                Skore: {validationScore}/100
              </div>
            )}
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">{trips.length} cest</span>
              <span className="font-medium">{validationResults.totalKm.toLocaleString('cs')} km</span>
              <span className="font-semibold text-purple-600">
                {validationResults.totalReimb.toLocaleString('cs', { minimumFractionDigits: 0 })} Kc
              </span>
            </div>
          </div>

          {/* Show AI validation issues if any errors */}
          {validationIssues.filter(i => i.severity === 'error').length > 0 && (
            <div className="mt-3 space-y-1">
              {validationIssues.filter(i => i.severity === 'error').slice(0, 5).map((issue, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-600">
                  <XCircle className="h-3 w-3 shrink-0" />
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trips by month */}
      {months.map(month => {
        const monthTrips = tripsByMonth[month]
        const monthKm = monthTrips.reduce((s, t) => s + ((t.odometer_end || 0) - (t.odometer_start || 0)), 0)
        const monthReimb = monthTrips.reduce((s, t) => s + (t.reimbursement || 0), 0)

        return (
          <Card key={month} className="rounded-xl shadow-soft-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-display">{formatMonth(month)}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{monthTrips.length} cest</span>
                  <span>{monthKm.toLocaleString('cs')} km</span>
                  <span className="font-medium text-purple-600">{monthReimb.toLocaleString('cs', { minimumFractionDigits: 0 })} Kc</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 pl-4">#</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Cas</TableHead>
                      <TableHead>Odkud</TableHead>
                      <TableHead>Kam</TableHead>
                      <TableHead>Ucel</TableHead>
                      <TableHead className="text-right">km</TableHead>
                      <TableHead className="text-right">Tach.Z</TableHead>
                      <TableHead className="text-right">Tach.K</TableHead>
                      <TableHead className="text-right">Nahrada</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthTrips.map((trip, idx) => {
                      const globalIdx = trips.indexOf(trip)
                      const isEditing = editingIdx === globalIdx
                      const isWeekend = [0, 6].includes(new Date(trip.trip_date).getDay())
                      const hasIssue = validationIssues.some(i => i.trip_index === globalIdx && i.severity === 'error')

                      return (
                        <TableRow
                          key={trip.id}
                          className={cn(
                            isWeekend && 'bg-red-50 dark:bg-red-900/10',
                            hasIssue && !isWeekend && 'bg-amber-50 dark:bg-amber-900/10',
                            trip.manual_override && 'bg-blue-50/50 dark:bg-blue-900/5',
                          )}
                        >
                          <TableCell className="pl-4 text-xs text-muted-foreground">
                            {trip.generation_order + 1}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="date"
                                value={editData.trip_date || ''}
                                onChange={e => setEditData(d => ({ ...d, trip_date: e.target.value }))}
                                className="w-[120px] h-7 text-xs"
                              />
                            ) : (
                              <span className="text-sm">{new Date(trip.trip_date).toLocaleDateString('cs')}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Input
                                  value={editData.departure_time || ''}
                                  onChange={e => setEditData(d => ({ ...d, departure_time: e.target.value }))}
                                  className="w-[55px] h-7 text-xs"
                                  placeholder="08:00"
                                />
                                <Input
                                  value={editData.arrival_time || ''}
                                  onChange={e => setEditData(d => ({ ...d, arrival_time: e.target.value }))}
                                  className="w-[55px] h-7 text-xs"
                                  placeholder="10:00"
                                />
                              </div>
                            ) : (
                              `${(trip.departure_time || '').slice(0, 5)}-${(trip.arrival_time || '').slice(0, 5)}`
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editData.origin || ''}
                                onChange={e => setEditData(d => ({ ...d, origin: e.target.value }))}
                                className="w-[120px] h-7 text-xs"
                              />
                            ) : (
                              <span className="text-sm max-w-[120px] truncate block">{trip.origin}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editData.destination || ''}
                                onChange={e => setEditData(d => ({ ...d, destination: e.target.value }))}
                                className="w-[120px] h-7 text-xs"
                              />
                            ) : (
                              <span className="text-sm max-w-[120px] truncate block">{trip.destination}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editData.purpose || ''}
                                onChange={e => setEditData(d => ({ ...d, purpose: e.target.value }))}
                                className="w-[130px] h-7 text-xs"
                              />
                            ) : (
                              <span className="text-sm max-w-[130px] truncate block">{trip.purpose}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.distance_km || ''}
                                onChange={e => setEditData(d => ({ ...d, distance_km: parseInt(e.target.value) || 0 }))}
                                className="w-[60px] h-7 text-xs text-right"
                              />
                            ) : (
                              <>
                                {trip.distance_km}
                                {trip.is_round_trip && <span className="text-xs text-muted-foreground ml-0.5">zp</span>}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.odometer_start ?? ''}
                                onChange={e => setEditData(d => ({ ...d, odometer_start: parseInt(e.target.value) || 0 }))}
                                className="w-[70px] h-7 text-xs text-right"
                              />
                            ) : (
                              trip.odometer_start?.toLocaleString('cs')
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.odometer_end ?? ''}
                                onChange={e => setEditData(d => ({ ...d, odometer_end: parseInt(e.target.value) || 0 }))}
                                className="w-[70px] h-7 text-xs text-right"
                              />
                            ) : (
                              trip.odometer_end?.toLocaleString('cs')
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {trip.reimbursement ? `${trip.reimbursement.toLocaleString('cs')} Kc` : '-'}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={saveEdit} disabled={saving}>
                                  <Save className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => startEdit(globalIdx)}>
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Helper Components ──

function ValidationBadge({ ok, label, icon }: { ok: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
      ok ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    )}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {icon}
      {label}
    </div>
  )
}

function formatMonth(m: string): string {
  const MONTHS = ['', 'Leden', 'Unor', 'Brezen', 'Duben', 'Kveten', 'Cerven',
    'Cervenec', 'Srpen', 'Zari', 'Rijen', 'Listopad', 'Prosinec']
  const [y, mo] = m.split('-').map(Number)
  return `${MONTHS[mo]} ${y}`
}
