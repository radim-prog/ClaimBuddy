'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  X, Camera, Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw, Send,
  ShieldCheck, Pencil, Plus, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ExtractedDataDisplay,
  ExtractionDocumentType,
  ExtractedData,
  ExtractionStatus,
  ConfidenceBadge,
} from '@/components/extraction'
import { toast } from 'sonner'

interface ScanOverlayProps {
  open: boolean
  companyId: string
  companies: Array<{ id: string; name: string }>
  onClose: () => void
  initialFile?: File | null
}

interface ScanJob {
  file: File
  previewUrl: string
  documentType: ExtractionDocumentType
  status: ExtractionStatus
  extractedData?: ExtractedData
  confidenceScore?: number
  corrections: Array<{ field: string; original: unknown; corrected: unknown }>
  notes?: string
  draftId?: string
  documentId?: string
}

type VerifyStep = 'upload' | 'extracting' | 'verify'

export function ScanOverlay({ open, companyId: initialCompanyId, companies, onClose, initialFile }: ScanOverlayProps) {
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [documentType, setDocumentType] = useState<ExtractionDocumentType>('invoice')
  const [job, setJob] = useState<ScanJob | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [verifyEditing, setVerifyEditing] = useState(false)
  const [verifySubmitting, setVerifySubmitting] = useState(false)

  // Inline correction fields
  const [corrSupplier, setCorrSupplier] = useState('')
  const [corrIco, setCorrIco] = useState('')
  const [corrAmount, setCorrAmount] = useState('')
  const [corrDate, setCorrDate] = useState('')
  const [corrVs, setCorrVs] = useState('')
  const [corrVat, setCorrVat] = useState('')

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Keep companyId in sync with prop
  useEffect(() => {
    setCompanyId(initialCompanyId)
  }, [initialCompanyId])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    const newJob: ScanJob = {
      file,
      previewUrl: URL.createObjectURL(file),
      documentType,
      status: 'uploaded',
      corrections: [],
    }
    setJob(newJob)
    processExtraction(newJob)
  }, [documentType, companyId])

  // Auto-process initialFile (from native camera)
  useEffect(() => {
    if (open && initialFile && !job) {
      const dt = new DataTransfer()
      dt.items.add(initialFile)
      handleFileSelect(dt.files)
    }
  }, [open, initialFile, handleFileSelect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setJob(null)
        setShowSuccess(false)
        setDocumentType('invoice')
        setVerifyEditing(false)
        setVerifySubmitting(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Populate correction fields when extracted data arrives
  useEffect(() => {
    if (job?.extractedData && (job.status === 'extracted' || job.status === 'corrected' || job.status === 'validated')) {
      const d = job.extractedData as Record<string, unknown>
      setCorrSupplier((d.supplier_name as string) || '')
      setCorrIco((d.supplier_ico as string) || '')
      setCorrAmount(d.total_amount != null ? String(d.total_amount) : '')
      setCorrDate((d.date_issued as string) || '')
      setCorrVs((d.variable_symbol as string) || '')
      setCorrVat(d.total_vat != null ? String(d.total_vat) : '')
    }
  }, [job?.extractedData, job?.status])

  const processExtraction = async (scanJob: ScanJob) => {
    setJob(prev => prev ? { ...prev, status: 'extracting' } : prev)

    try {
      const formData = new FormData()
      formData.append('file', scanJob.file)
      formData.append('documentType', scanJob.documentType)
      formData.append('companyId', companyId)

      const response = await fetch('/api/client/extract', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      // Extraction not available or failed — save file without extraction
      if (!response.ok || data.extractionAvailable === false) {
        await saveFileWithoutExtraction(scanJob)
        return
      }

      // Update document type from AI detection
      const detectedType = data.detectedDocumentType as ExtractionDocumentType | undefined
      if (detectedType) setDocumentType(detectedType)

      const updatedJob: ScanJob = {
        ...scanJob,
        documentType: detectedType || scanJob.documentType,
        status: 'extracted',
        extractedData: data.extractedData,
        confidenceScore: data.confidenceScore,
        documentId: data.documentId || undefined,
        corrections: (data.corrections || []).map((c: any) => ({
          field: c.field,
          original: c.originalValue,
          corrected: c.correctedValue,
        })),
      }
      setJob(updatedJob)

      // Auto-save draft
      saveDraft(updatedJob, data.extractedData)
    } catch {
      // Network error or other failure — still try to save the file
      try {
        await saveFileWithoutExtraction(scanJob)
      } catch {
        setJob(prev => prev ? { ...prev, status: 'error' } : prev)
      }
    }
  }

  const saveFileWithoutExtraction = async (scanJob: ScanJob) => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const uploadForm = new FormData()
    uploadForm.append('file', scanJob.file)
    uploadForm.append('companyId', companyId)
    uploadForm.append('period', period)
    uploadForm.append('type', scanJob.documentType === 'receipt' ? 'receipt' : 'expense_invoice')

    try {
      const uploadRes = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadForm,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        setJob(prev => prev ? { ...prev, status: 'uploaded_only', draftId: uploadData.document?.id, documentId: uploadData.document?.id } : prev)
        toast.success('Doklad nahrán, čeká na zpracování')
      } else {
        const res = await fetch('/api/client/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            file_name: scanJob.file.name,
            document_type: scanJob.documentType,
            extracted_data: null,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setJob(prev => prev ? { ...prev, status: 'uploaded_only', draftId: data.id } : prev)
          toast.success('Doklad nahrán, čeká na zpracování')
        } else {
          setJob(prev => prev ? { ...prev, status: 'error' } : prev)
        }
      }
    } catch {
      setJob(prev => prev ? { ...prev, status: 'error' } : prev)
    }
  }

  const saveDraft = async (scanJob: ScanJob, extractedData: ExtractedData) => {
    try {
      const res = await fetch('/api/client/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          file_name: scanJob.file.name,
          document_type: scanJob.documentType,
          extracted_data: extractedData,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          setJob(prev => prev ? { ...prev, draftId: data.id } : prev)
        }
      }
    } catch {
      // Silent fail
    }
  }

  const debouncedUpdateDraft = useCallback((draftId: string, extractedData: ExtractedData, notes?: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/client/drafts/${draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extracted_data: extractedData, notes }),
        })
      } catch {
        // Silent
      }
    }, 3000)
  }, [])

  const handleFieldCorrection = (field: string, value: string | number) => {
    if (!job) return
    const originalValue = (job.extractedData as unknown as Record<string, unknown>)?.[field]
    const newData = { ...job.extractedData, [field]: value } as ExtractedData
    const correction = { field, original: originalValue, corrected: value }

    const updated: ScanJob = {
      ...job,
      extractedData: newData,
      corrections: [...job.corrections, correction],
      status: 'corrected',
    }
    setJob(updated)

    if (job.draftId) {
      debouncedUpdateDraft(job.draftId, newData, job.notes)
    }
  }

  // Verify: confirm extraction data is correct (calls /api/client/documents/[id]/verify)
  const handleVerifyConfirm = async () => {
    if (!job) return
    setVerifySubmitting(true)

    try {
      // Build corrections from edited fields
      const corrections: Record<string, unknown> = {}
      const data = job.extractedData as Record<string, unknown>
      if (corrSupplier !== (data?.supplier_name || '')) corrections.supplier_name = corrSupplier
      if (corrIco !== (data?.supplier_ico || '')) corrections.supplier_ico = corrIco
      if (corrAmount !== String(data?.total_amount || '')) {
        const parsed = parseFloat(corrAmount)
        corrections.total_amount = isNaN(parsed) ? undefined : parsed
      }
      if (corrDate !== (data?.date_issued || '')) corrections.date_issued = corrDate
      if (corrVs !== (data?.variable_symbol || '')) corrections.variable_symbol = corrVs
      if (corrVat !== String(data?.total_vat || '')) {
        const parsed = parseFloat(corrVat)
        corrections.total_vat = isNaN(parsed) ? undefined : parsed
      }

      const docId = job.documentId || job.draftId
      if (docId) {
        const res = await fetch(`/api/client/documents/${docId}/verify`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verified: true,
            corrections: Object.keys(corrections).length > 0 ? corrections : undefined,
          }),
        })
        if (!res.ok) { toast.error('Ověření se nezdařilo'); return }
      }

      // Also submit the draft
      if (job.draftId) {
        await fetch(`/api/client/drafts/${job.draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'submitted',
            extracted_data: job.extractedData,
            notes: job.notes,
          }),
        })
      }

      setShowSuccess(true)
      toast.success('Doklad ověřen a odeslán')
      setTimeout(() => onClose(), 1500)
    } catch {
      toast.error('Odeslání se nezdařilo')
    } finally {
      setVerifySubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!job) return

    try {
      if (job.draftId) {
        await fetch(`/api/client/drafts/${job.draftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'submitted',
            extracted_data: job.extractedData,
            notes: job.notes,
          }),
        })
      } else {
        await fetch('/api/client/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissions: [{
              company_id: companyId,
              file_name: job.file.name,
              document_type: job.documentType,
              extracted_data: job.extractedData,
              corrections: job.corrections,
              notes: job.notes,
            }],
          }),
        })
      }

      setShowSuccess(true)
      toast.success('Doklad odeslán')
      setTimeout(() => onClose(), 1500)
    } catch {
      toast.error('Odeslání se nezdařilo')
    }
  }

  const handleRetry = () => {
    if (job) processExtraction(job)
  }

  const handleScanAnother = () => {
    setJob(null)
    setShowSuccess(false)
    setVerifyEditing(false)
    setVerifySubmitting(false)
  }

  const isDataReady = job && (job.status === 'extracted' || job.status === 'corrected' || job.status === 'validated')

  // Current step for progress indicator
  const currentStep: VerifyStep = !job ? 'upload' : job.status === 'extracting' ? 'extracting' : isDataReady ? 'verify' : 'upload'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60]',
        'bg-background md:bg-black/50 md:backdrop-blur-sm',
        'flex flex-col md:items-center md:justify-center md:p-6',
        'transition-all duration-300 ease-out',
        open ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:opacity-0 pointer-events-none',
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="flex flex-col flex-1 md:flex-initial w-full md:max-w-2xl md:max-h-[85vh] md:rounded-2xl md:shadow-2xl md:bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-lg font-bold font-display">Nahrát doklad</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 3-step progress indicator */}
      {!showSuccess && job && (
        <div className="flex items-center px-4 py-2 border-b bg-muted/30 shrink-0">
          <StepIndicator step={1} label="Nahrávání" active={currentStep === 'upload'} done={currentStep !== 'upload'} />
          <div className="flex-1 h-px bg-border mx-2" />
          <StepIndicator step={2} label="Vytěžování" active={currentStep === 'extracting'} done={currentStep === 'verify'} />
          <div className="flex-1 h-px bg-border mx-2" />
          <StepIndicator step={3} label="Ověření" active={currentStep === 'verify'} done={false} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
        {/* Hidden inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = '' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = '' }}
        />

        {/* Company selector if multiple */}
        {companies.length > 1 && (
          <div>
            <Label className="mb-1.5 block text-sm">Firma</Label>
            <select
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Success state */}
        {showSuccess && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold font-display mb-2">Doklad odeslán!</h3>
            <p className="text-muted-foreground mb-6">Byl úspěšně odeslán k účetnímu zpracování.</p>
            <Button variant="outline" onClick={handleScanAnother}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nahrát další
            </Button>
          </div>
        )}

        {/* Capture buttons — straight to upload, AI auto-detects type */}
        {!job && !showSuccess && (
          <div className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Nahrajte doklad — typ rozpoznáme automaticky
            </p>

            <Button
              className="w-full h-16 text-lg gap-3"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-6 h-6" />
              Vyfotit doklad
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5" />
              Nahrát ze souboru
            </Button>
          </div>
        )}

        {/* Extracting — Step 2 progress */}
        {job?.status === 'extracting' && (
          <div className="text-center py-12">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
              <Sparkles className="w-6 h-6 text-blue-500 absolute top-0 right-0 animate-pulse" />
            </div>
            <p className="font-medium text-lg mb-1">Vytěžuji data z dokladu...</p>
            <p className="text-sm text-muted-foreground">Rozpoznávám text, datum, částku a dodavatele</p>
            <div className="mt-4 w-48 mx-auto">
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {/* Uploaded without extraction */}
        {job?.status === 'uploaded_only' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Doklad nahrán</h3>
            <p className="text-muted-foreground mb-4">Čeká na zpracování účetní.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={onClose}>
                Zavřít
              </Button>
              <Button variant="outline" onClick={handleScanAnother}>
                <Plus className="w-4 h-4 mr-1" />
                Nahrát další
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {job?.status === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nahrání se nezdařilo</h3>
            <p className="text-muted-foreground mb-4">Zkuste to prosím znovu.</p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Zkusit znovu
              </Button>
              <Button variant="outline" onClick={handleScanAnother}>
                Jiný soubor
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verify extracted data */}
        {isDataReady && !showSuccess && (
          <>
            {/* Preview thumbnail */}
            {job.file.type.startsWith('image/') && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden max-h-40">
                <img
                  src={job.previewUrl}
                  alt="Náhled"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Confidence badge */}
            {job.confidenceScore != null && (
              <div className="flex items-center gap-2">
                <ConfidenceBadge score={job.confidenceScore} size="md" />
                {job.draftId && (
                  <span className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Uloženo
                  </span>
                )}
              </div>
            )}

            {/* Verification form — compact inline fields */}
            <div className="space-y-3 bg-muted/30 rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">Vytěžená data</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVerifyEditing(!verifyEditing)}
                  className="h-7 text-xs"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  {verifyEditing ? 'Hotovo' : 'Opravit'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <VerifyField
                  label="Dodavatel"
                  value={corrSupplier}
                  editing={verifyEditing}
                  onChange={setCorrSupplier}
                />
                <VerifyField
                  label="IČO"
                  value={corrIco}
                  editing={verifyEditing}
                  onChange={setCorrIco}
                />
                <VerifyField
                  label="Částka celkem"
                  value={corrAmount}
                  editing={verifyEditing}
                  onChange={setCorrAmount}
                  suffix="Kč"
                />
                <VerifyField
                  label="DPH"
                  value={corrVat}
                  editing={verifyEditing}
                  onChange={setCorrVat}
                  suffix="Kč"
                />
                <VerifyField
                  label="Datum vystavení"
                  value={corrDate}
                  editing={verifyEditing}
                  onChange={setCorrDate}
                  type="date"
                />
                <VerifyField
                  label="Variabilní symbol"
                  value={corrVs}
                  editing={verifyEditing}
                  onChange={setCorrVs}
                />
              </div>

              {/* Full extraction display (expandable) */}
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Zobrazit všechna pole
                </summary>
                <div className="mt-2">
                  <ExtractedDataDisplay
                    data={job.extractedData!}
                    documentType={job.documentType}
                    confidenceScore={job.confidenceScore}
                    editable={verifyEditing}
                    onFieldChange={handleFieldCorrection}
                    corrections={job.corrections}
                  />
                </div>
              </details>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm">Poznámka pro účetní</Label>
              <Textarea
                placeholder="Např.: Souvisí s projektem X, služební cesta..."
                value={job.notes || ''}
                onChange={(e) => {
                  const notes = e.target.value
                  setJob(prev => prev ? { ...prev, notes } : prev)
                  if (job.draftId) {
                    debouncedUpdateDraft(job.draftId, job.extractedData!, notes)
                  }
                }}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-12 text-base gap-2"
                onClick={handleVerifyConfirm}
                disabled={verifySubmitting}
              >
                {verifySubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                Potvrdit správnost
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Odeslat bez ověření
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScanAnother}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Další
                </Button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
      </div>
    </div>
  )
}


// ===== Step indicator =====

function StepIndicator({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
        done ? 'bg-green-500 text-white' :
        active ? 'bg-blue-600 text-white' :
        'bg-gray-200 dark:bg-gray-700 text-gray-500'
      )}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={cn(
        'text-xs font-medium',
        active ? 'text-blue-600' : done ? 'text-green-600' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}


// ===== Verify field =====

function VerifyField({
  label,
  value,
  editing,
  onChange,
  suffix,
  type = 'text',
}: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  suffix?: string
  type?: string
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-8 text-sm"
          />
          {suffix && <span className="text-xs text-muted-foreground shrink-0">{suffix}</span>}
        </div>
      ) : (
        <p className="text-sm font-medium">
          {value || <span className="text-muted-foreground italic">—</span>}
          {suffix && value ? ` ${suffix}` : ''}
        </p>
      )}
    </div>
  )
}
