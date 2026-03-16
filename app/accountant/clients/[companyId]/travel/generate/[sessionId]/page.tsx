'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, Check, Loader2, FileSearch, Fuel,
  Car, Users, Sparkles, AlertTriangle, Plus, Trash2, Gauge,
  Calendar, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { TravelVehicle, TravelDriver } from '@/lib/types/travel'
import type { GenerationSession, FuelData, OdometerReading, DriverAvailability } from '@/lib/travel-generation-store'

// ── Step definitions ──

const STEPS = [
  { id: 1, label: 'Doklady PHM', icon: FileSearch },
  { id: 2, label: 'Kontrola PHM', icon: Fuel },
  { id: 3, label: 'Vozidla a ridici', icon: Car },
  { id: 4, label: 'Souhrn', icon: Sparkles },
] as const

// ── Types ──

interface DetectedDoc {
  document_id: string
  is_fuel: boolean
  confidence: number
  fuel_type: string | null
  station_name: string | null
  file_name: string | null
  period: string | null
  date_issued: string | null
  total_with_vat: number | null
  supplier_name: string | null
}

interface FuelRow extends Omit<FuelData, 'id' | 'session_id'> {
  id?: string
  _tempId?: string
}

interface OdometerRow {
  vehicle_id: string
  vehicle_name: string
  license_plate: string
  odometer_start: number
  odometer_end: number
  current_odometer: number
}

interface DriverRow {
  driver_id: string
  driver_name: string
  total_working_days: number
  vacation_days: number
  sick_days: number
}

// ── Main Component ──

export default function TravelGenerateWizardPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const sessionId = params.sessionId as string

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState<GenerationSession | null>(null)

  // Step 1: Document selection
  const [detectedDocs, setDetectedDocs] = useState<DetectedDoc[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [detecting, setDetecting] = useState(false)

  // Step 2: Fuel data
  const [fuelRows, setFuelRows] = useState<FuelRow[]>([])

  // Step 3: Vehicles + drivers
  const [vehicles, setVehicles] = useState<TravelVehicle[]>([])
  const [drivers, setDrivers] = useState<TravelDriver[]>([])
  const [odometerRows, setOdometerRows] = useState<OdometerRow[]>([])
  const [driverRows, setDriverRows] = useState<DriverRow[]>([])

  // ── API helpers ──

  const apiBase = `/api/accountant/companies/${companyId}/travel/generate`

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, options)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return res.json()
  }, [])

  // ── Load session on mount ──

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`${apiBase}/${sessionId}`)
        setSession(data.session)

        // If session already has fuel data, pre-fill
        if (data.fuelData?.length > 0) {
          setFuelRows(data.fuelData)
        }

        // Determine initial step from session status
        if (data.session.status === 'documents_selected') setStep(2)
        else if (data.session.status === 'fuel_verified') setStep(3)
        else if (data.session.status === 'vehicles_configured') setStep(4)
      } catch (err: unknown) {
        toast.error('Nepodařilo se načíst session')
        router.push(`/accountant/clients/${companyId}/travel`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiBase, sessionId, apiFetch, companyId, router])

  // ── Step 1: Detect fuel documents ──

  const detectDocuments = useCallback(async () => {
    if (!session) return
    setDetecting(true)
    try {
      const data = await apiFetch(`${apiBase}/detect-fuel-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: session.period_start,
          period_end: session.period_end,
        }),
      })
      setDetectedDocs(data.fuel_documents || [])
      // Auto-select high confidence
      const autoSelected = new Set<string>()
      for (const doc of (data.fuel_documents || [])) {
        if (doc.confidence >= 0.5) autoSelected.add(doc.document_id)
      }
      setSelectedDocIds(autoSelected)
      toast.success(`Nalezeno ${data.total_detected} PHM dokladu z ${data.total_scanned} celkem`)
    } catch (err: unknown) {
      toast.error('Chyba pri detekci dokladu')
    } finally {
      setDetecting(false)
    }
  }, [session, apiBase, apiFetch])

  // Auto-detect on step 1 if no docs yet
  useEffect(() => {
    if (step === 1 && session && detectedDocs.length === 0 && !detecting) {
      detectDocuments()
    }
  }, [step, session, detectedDocs.length, detecting, detectDocuments])

  const toggleDoc = (docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  const selectAllDocs = () => {
    if (selectedDocIds.size === detectedDocs.length) {
      setSelectedDocIds(new Set())
    } else {
      setSelectedDocIds(new Set(detectedDocs.map(d => d.document_id)))
    }
  }

  // Tag selected documents + extract fuel
  const tagDocuments = async () => {
    if (selectedDocIds.size === 0) {
      toast.error('Vyberte alespon jeden doklad')
      return
    }
    setSaving(true)
    try {
      const data = await apiFetch(`${apiBase}/${sessionId}/tag-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: Array.from(selectedDocIds) }),
      })
      setFuelRows(data.fuel_data || [])
      setSession(prev => prev ? { ...prev, status: 'documents_selected' } : prev)
      toast.success(`Oznaceno ${data.tagged_count} dokladu, vytezeno ${data.extracted_count} PHM zaznamu`)
      setStep(2)
    } catch (err: unknown) {
      toast.error('Chyba pri oznacovani dokladu')
    } finally {
      setSaving(false)
    }
  }

  // ── Step 2: Fuel editing ──

  const updateFuelRow = (index: number, field: keyof FuelRow, value: unknown) => {
    setFuelRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addManualFuelRow = () => {
    const today = new Date().toISOString().split('T')[0]
    setFuelRows(prev => [...prev, {
      _tempId: `manual_${Date.now()}`,
      document_id: null,
      vehicle_id: null,
      log_date: today,
      liters: 0,
      price_per_liter: null,
      total_price: null,
      odometer: null,
      station_name: null,
      source: 'manual' as const,
      confidence: 0,
      raw_ocr_fields: null,
      manually_edited: false,
    }])
  }

  const removeFuelRow = (index: number) => {
    setFuelRows(prev => prev.filter((_, i) => i !== index))
  }

  const saveFuelAndContinue = async () => {
    setSaving(true)
    try {
      await apiFetch(`${apiBase}/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'fuel_verified' }),
      })
      setSession(prev => prev ? { ...prev, status: 'fuel_verified' } : prev)
      setStep(3)

      // Load vehicles + drivers for step 3
      const [vRes, dRes] = await Promise.all([
        apiFetch(`/api/accountant/companies/${companyId}/travel/vehicles`),
        apiFetch(`/api/accountant/companies/${companyId}/travel/trips?limit=0`).catch(() => ({ drivers: [] })),
      ])
      const vList: TravelVehicle[] = vRes.vehicles || []
      setVehicles(vList)

      // Initialize odometer rows from vehicles
      setOdometerRows(vList.filter(v => v.is_active).map(v => ({
        vehicle_id: v.id,
        vehicle_name: v.name,
        license_plate: v.license_plate,
        odometer_start: v.current_odometer,
        odometer_end: v.current_odometer,
        current_odometer: v.current_odometer,
      })))
    } catch (err: unknown) {
      toast.error('Chyba pri ukladani')
    } finally {
      setSaving(false)
    }
  }

  // ── Step 3: Vehicles + drivers ──

  // Fetch drivers separately
  useEffect(() => {
    if (step === 3 && drivers.length === 0) {
      apiFetch(`/api/accountant/companies/${companyId}/travel/vehicles`)
        .then(res => {
          // drivers are on vehicles endpoint? No, need separate
        })
        .catch(() => {})

      // Try to load drivers via company driver list
      fetch(`/api/accountant/companies/${companyId}/travel/trips?limit=1`)
        .then(r => r.json())
        .catch(() => null)
    }
  }, [step, drivers.length, companyId, apiFetch])

  const updateOdometer = (index: number, field: 'odometer_start' | 'odometer_end', value: number) => {
    setOdometerRows(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const saveVehiclesAndContinue = async () => {
    // Validate odometers
    for (const row of odometerRows) {
      if (row.odometer_end < row.odometer_start) {
        toast.error(`Koncovy tachometr u ${row.license_plate} musi byt vetsi nez pocatecni`)
        return
      }
    }

    setSaving(true)
    try {
      await apiFetch(`${apiBase}/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'vehicles_configured' }),
      })
      setSession(prev => prev ? { ...prev, status: 'vehicles_configured' } : prev)
      setStep(4)
    } catch (err: unknown) {
      toast.error('Chyba pri ukladani vozidel')
    } finally {
      setSaving(false)
    }
  }

  // ── Step 4: Summary + Generate ──

  const totalFuelLiters = fuelRows.reduce((sum, r) => sum + (r.liters || 0), 0)
  const totalFuelCost = fuelRows.reduce((sum, r) => sum + (r.total_price || 0), 0)
  const totalKm = odometerRows.reduce((sum, r) => sum + Math.max(0, r.odometer_end - r.odometer_start), 0)

  const handleGenerate = async () => {
    setSaving(true)
    try {
      await apiFetch(`${apiBase}/${sessionId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      toast.success('Generovani zahajeno! AI zpracovava data...')
      // Navigate to review page — will poll status there
      router.push(`/accountant/clients/${companyId}/travel/generate/${sessionId}/review`)
    } catch (err: unknown) {
      toast.error('Chyba pri spusteni generovani')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu chcete smazat tuto session? Vsechna data budou ztracena.')) return
    try {
      await apiFetch(`${apiBase}/${sessionId}`, { method: 'DELETE' })
      toast.success('Session smazana')
      router.push(`/accountant/clients/${companyId}/travel`)
    } catch {
      toast.error('Chyba pri mazani session')
    }
  }

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (!session) return null

  // ── Stepper ──

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
          <div>
            <h2 className="text-lg font-semibold font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Generator knihy jizd
            </h2>
            <p className="text-sm text-muted-foreground">
              Obdobi: {session.period_start} az {session.period_end}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Smazat
        </Button>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon
          const isActive = step === s.id
          const isDone = step > s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                  isActive && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                  isDone && 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                  !isActive && !isDone && 'text-muted-foreground'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <StepIcon className={cn('h-4 w-4 shrink-0', isActive && 'text-purple-500')} />
                )}
                <span className="hidden sm:inline truncate">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn(
                  'h-0.5 w-4 mx-1 shrink-0',
                  isDone ? 'bg-green-400' : 'bg-muted'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      {step === 1 && (
        <StepDocumentSelector
          detectedDocs={detectedDocs}
          selectedDocIds={selectedDocIds}
          detecting={detecting}
          saving={saving}
          onToggle={toggleDoc}
          onSelectAll={selectAllDocs}
          onDetect={detectDocuments}
          onContinue={tagDocuments}
        />
      )}

      {step === 2 && (
        <StepFuelReview
          fuelRows={fuelRows}
          vehicles={vehicles}
          saving={saving}
          onUpdate={updateFuelRow}
          onAdd={addManualFuelRow}
          onRemove={removeFuelRow}
          onContinue={saveFuelAndContinue}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepVehiclesDrivers
          odometerRows={odometerRows}
          driverRows={driverRows}
          saving={saving}
          onUpdateOdometer={updateOdometer}
          onContinue={saveVehiclesAndContinue}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <StepSummary
          session={session}
          fuelRows={fuelRows}
          odometerRows={odometerRows}
          totalFuelLiters={totalFuelLiters}
          totalFuelCost={totalFuelCost}
          totalKm={totalKm}
          selectedDocCount={selectedDocIds.size}
          saving={saving}
          onGenerate={handleGenerate}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════
// Step 1: Document Selector
// ══════════════════════════════════════════════════

function StepDocumentSelector({
  detectedDocs, selectedDocIds, detecting, saving,
  onToggle, onSelectAll, onDetect, onContinue,
}: {
  detectedDocs: DetectedDoc[]
  selectedDocIds: Set<string>
  detecting: boolean
  saving: boolean
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDetect: () => void
  onContinue: () => void
}) {
  return (
    <Card className="rounded-xl shadow-soft-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-purple-500" />
          Krok 1: Vyberte doklady o PHM
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automaticky jsme naskenovali doklady v obdobi a oznacili potencialni PHM doklady.
          Zkontrolujte a upravte vyber.
        </p>
      </CardHeader>
      <CardContent>
        {detecting ? (
          <div className="flex items-center justify-center py-12 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span className="text-sm text-muted-foreground">Skenuji doklady...</span>
          </div>
        ) : detectedDocs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileSearch className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Zadne doklady nalezeny pro zvolene obdobi.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onDetect}>
              Zkusit znovu
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDocIds.size === detectedDocs.length && detectedDocs.length > 0}
                  onCheckedChange={onSelectAll}
                />
                <span className="text-sm font-medium">
                  Vybrano {selectedDocIds.size} z {detectedDocs.length}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onDetect} disabled={detecting}>
                Preskenovat
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Doklad</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Dodavatel</TableHead>
                    <TableHead className="text-right">Castka</TableHead>
                    <TableHead className="text-center">Skore</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detectedDocs.map(doc => {
                    const isSelected = selectedDocIds.has(doc.document_id)
                    return (
                      <TableRow
                        key={doc.document_id}
                        className={cn('cursor-pointer', isSelected && 'bg-purple-50/50 dark:bg-purple-900/10')}
                        onClick={() => onToggle(doc.document_id)}
                      >
                        <TableCell>
                          <Checkbox checked={isSelected} onCheckedChange={() => onToggle(doc.document_id)} />
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {doc.file_name || doc.document_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.date_issued ? new Date(doc.date_issued).toLocaleDateString('cs') : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {doc.supplier_name || doc.station_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {doc.total_with_vat ? `${doc.total_with_vat.toLocaleString('cs')} Kc` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <ConfidenceBadge score={doc.confidence} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <div className="flex justify-end mt-4 gap-2">
          <Button onClick={onContinue} disabled={saving || selectedDocIds.size === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Oznacit a pokracovat
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════
// Step 2: Fuel Review
// ══════════════════════════════════════════════════

function StepFuelReview({
  fuelRows, vehicles, saving,
  onUpdate, onAdd, onRemove, onContinue, onBack,
}: {
  fuelRows: FuelRow[]
  vehicles: TravelVehicle[]
  saving: boolean
  onUpdate: (index: number, field: keyof FuelRow, value: unknown) => void
  onAdd: () => void
  onRemove: (index: number) => void
  onContinue: () => void
  onBack: () => void
}) {
  const totalLiters = fuelRows.reduce((s, r) => s + (r.liters || 0), 0)
  const totalCost = fuelRows.reduce((s, r) => s + (r.total_price || 0), 0)

  return (
    <Card className="rounded-xl shadow-soft-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Fuel className="h-5 w-5 text-purple-500" />
          Krok 2: Kontrola dat o PHM
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Zkontrolujte a upravte vytezena data z dokladu. Muzete pridat i manualni zaznamy.
        </p>
      </CardHeader>
      <CardContent>
        {fuelRows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Fuel className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Zadne PHM zaznamy. Pridejte manualni zaznam.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Stanice</TableHead>
                  <TableHead className="text-right">Litry</TableHead>
                  <TableHead className="text-right">Kc/l</TableHead>
                  <TableHead className="text-right">Celkem Kc</TableHead>
                  <TableHead className="text-right">Tachometr</TableHead>
                  <TableHead className="text-center">Zdroj</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelRows.map((row, idx) => (
                  <TableRow key={row.id || row._tempId || idx}>
                    <TableCell>
                      <Input
                        type="date"
                        value={row.log_date}
                        onChange={e => onUpdate(idx, 'log_date', e.target.value)}
                        className="w-[130px] h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.station_name || ''}
                        onChange={e => onUpdate(idx, 'station_name', e.target.value)}
                        placeholder="Stanice"
                        className="w-[120px] h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={row.liters || ''}
                        onChange={e => onUpdate(idx, 'liters', parseFloat(e.target.value) || 0)}
                        className="w-[80px] h-8 text-sm text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={row.price_per_liter ?? ''}
                        onChange={e => onUpdate(idx, 'price_per_liter', parseFloat(e.target.value) || null)}
                        className="w-[80px] h-8 text-sm text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={row.total_price ?? ''}
                        onChange={e => onUpdate(idx, 'total_price', parseFloat(e.target.value) || null)}
                        className="w-[90px] h-8 text-sm text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={row.odometer ?? ''}
                        onChange={e => onUpdate(idx, 'odometer', parseInt(e.target.value) || null)}
                        className="w-[90px] h-8 text-sm text-right"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <SourceBadge source={row.source} confidence={row.confidence} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Pridat zaznam
            </Button>
            {fuelRows.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Celkem: {totalLiters.toFixed(1)} l / {totalCost.toLocaleString('cs')} Kc
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zpet
            </Button>
            <Button onClick={onContinue} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pokracovat
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════
// Step 3: Vehicles + Drivers
// ══════════════════════════════════════════════════

function StepVehiclesDrivers({
  odometerRows, driverRows, saving,
  onUpdateOdometer, onContinue, onBack,
}: {
  odometerRows: OdometerRow[]
  driverRows: DriverRow[]
  saving: boolean
  onUpdateOdometer: (index: number, field: 'odometer_start' | 'odometer_end', value: number) => void
  onContinue: () => void
  onBack: () => void
}) {
  return (
    <Card className="rounded-xl shadow-soft-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Car className="h-5 w-5 text-purple-500" />
          Krok 3: Vozidla a ridici
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Nastavte pocatecni a koncovy stav tachometru pro kazde vozidlo.
        </p>
      </CardHeader>
      <CardContent>
        {/* Odometer section */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Stavy tachometru
          </h4>
          {odometerRows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Zadna aktivni vozidla. Pridejte vozidla v sekci Kniha jizd.
            </p>
          ) : (
            <div className="space-y-3">
              {odometerRows.map((row, idx) => {
                const km = Math.max(0, row.odometer_end - row.odometer_start)
                return (
                  <div key={row.vehicle_id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="min-w-[140px]">
                      <div className="font-medium text-sm">{row.vehicle_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{row.license_plate}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div>
                        <Label className="text-xs text-muted-foreground">Pocatek</Label>
                        <Input
                          type="number"
                          value={row.odometer_start}
                          onChange={e => onUpdateOdometer(idx, 'odometer_start', parseInt(e.target.value) || 0)}
                          className="w-[110px] h-8 text-sm"
                        />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-5" />
                      <div>
                        <Label className="text-xs text-muted-foreground">Konec</Label>
                        <Input
                          type="number"
                          value={row.odometer_end}
                          onChange={e => onUpdateOdometer(idx, 'odometer_end', parseInt(e.target.value) || 0)}
                          className="w-[110px] h-8 text-sm"
                        />
                      </div>
                      <div className="mt-5">
                        <Badge variant="outline" className="text-xs">
                          {km.toLocaleString('cs')} km
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Driver availability - simplified */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Ridici (volitelne)
          </h4>
          <p className="text-sm text-muted-foreground py-2">
            Konfigurace ridicu a pracovnich dnu bude dostupna v pokrocile verzi generatoru.
          </p>
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpet
          </Button>
          <Button onClick={onContinue} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pokracovat
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════
// Step 4: Summary
// ══════════════════════════════════════════════════

function StepSummary({
  session, fuelRows, odometerRows,
  totalFuelLiters, totalFuelCost, totalKm, selectedDocCount,
  saving, onGenerate, onBack,
}: {
  session: GenerationSession
  fuelRows: FuelRow[]
  odometerRows: OdometerRow[]
  totalFuelLiters: number
  totalFuelCost: number
  totalKm: number
  selectedDocCount: number
  saving: boolean
  onGenerate: () => void
  onBack: () => void
}) {
  const estimatedCredits = Math.max(1, Math.ceil(fuelRows.length / 5))

  return (
    <Card className="rounded-xl shadow-soft-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-display flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Krok 4: Souhrn a generovani
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Zkontrolujte vstupni data a spustte AI generovani knihy jizd.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Obdobi" value={`${session.period_start} - ${session.period_end}`} />
          <SummaryCard label="PHM doklady" value={selectedDocCount.toString()} />
          <SummaryCard label="PHM zaznamy" value={fuelRows.length.toString()} />
          <SummaryCard label="Celkem PHM" value={`${totalFuelLiters.toFixed(0)} l`} />
          <SummaryCard label="Naklady PHM" value={`${totalFuelCost.toLocaleString('cs')} Kc`} />
          <SummaryCard label="Vozidla" value={odometerRows.length.toString()} />
          <SummaryCard label="Celkem km" value={`${totalKm.toLocaleString('cs')} km`} />
          <SummaryCard label="Kredity" value={`~${estimatedCredits}`} highlight />
        </div>

        {totalKm === 0 && odometerRows.length > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg mb-4 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Zadne kilometry z tachometru. Nastavte koncovy stav u vozidel v kroku 3.</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpet
          </Button>
          <Button
            onClick={onGenerate}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generovat knihu jizd
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Helper components ──

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : pct >= 40
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return <Badge className={`${color} text-xs rounded-md`} variant="secondary">{pct}%</Badge>
}

function SourceBadge({ source, confidence }: { source: string; confidence: number }) {
  if (source === 'ocr') {
    return (
      <Badge variant="outline" className="text-xs">
        OCR {Math.round(confidence * 100)}%
      </Badge>
    )
  }
  return <Badge variant="outline" className="text-xs text-muted-foreground">Manualni</Badge>
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'p-3 rounded-lg text-center',
      highlight
        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
        : 'bg-muted/30'
    )}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={cn(
        'font-semibold text-sm',
        highlight && 'text-purple-700 dark:text-purple-300'
      )}>
        {value}
      </div>
    </div>
  )
}
