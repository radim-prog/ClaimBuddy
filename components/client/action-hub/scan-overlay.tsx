'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  X, Camera, Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DocumentTypeSelector,
  ExtractedDataDisplay,
  ExtractionDocumentType,
  ExtractedData,
  ExtractionStatus,
} from '@/components/extraction'
import { toast } from 'sonner'

interface ScanOverlayProps {
  open: boolean
  companyId: string
  companies: Array<{ id: string; name: string }>
  onClose: () => void
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
}

export function ScanOverlay({ open, companyId: initialCompanyId, companies, onClose }: ScanOverlayProps) {
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [documentType, setDocumentType] = useState<ExtractionDocumentType>('receipt')
  const [job, setJob] = useState<ScanJob | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoTriggered = useRef(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Keep companyId in sync with prop
  useEffect(() => {
    setCompanyId(initialCompanyId)
  }, [initialCompanyId])

  // Auto-trigger camera on open
  useEffect(() => {
    if (open && !autoTriggered.current && !job) {
      autoTriggered.current = true
      const timer = setTimeout(() => {
        cameraInputRef.current?.click()
      }, 150)
      return () => clearTimeout(timer)
    }
    if (!open) {
      autoTriggered.current = false
    }
  }, [open, job])

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      // Delay reset to allow close animation
      const timer = setTimeout(() => {
        setJob(null)
        setShowSuccess(false)
        setDocumentType('receipt')
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [open])

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

      if (!response.ok) throw new Error('Extrakce selhala')
      const data = await response.json()

      const updatedJob: ScanJob = {
        ...scanJob,
        status: 'extracted',
        extractedData: data.extractedData,
        confidenceScore: data.confidenceScore,
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
      toast.error('Odeslání selhalo')
    }
  }

  const handleRetry = () => {
    if (job) processExtraction(job)
  }

  const isDataReady = job && (job.status === 'extracted' || job.status === 'corrected' || job.status === 'validated')

  return (
    <div className={cn(
      'fixed inset-0 z-[60] bg-background flex flex-col',
      'transition-transform duration-300 ease-out',
      open ? 'translate-y-0' : 'translate-y-full pointer-events-none',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <h2 className="text-lg font-bold font-display">Nahrát doklad</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Success state */}
        {showSuccess && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold font-display mb-2">Doklad odeslán!</h3>
            <p className="text-muted-foreground">Byl úspěšně odeslán k účetnímu zpracování.</p>
          </div>
        )}

        {/* No file yet — show capture buttons */}
        {!job && !showSuccess && (
          <div className="space-y-3 pt-4">
            <DocumentTypeSelector value={documentType} onChange={setDocumentType} />

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

        {/* Extracting */}
        {job?.status === 'extracting' && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Vytěžuji data z dokladu...</p>
          </div>
        )}

        {/* Error */}
        {job?.status === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Vytěžování selhalo</h3>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Zkusit znovu
              </Button>
              <Button variant="outline" onClick={() => { setJob(null) }}>
                Jiný soubor
              </Button>
            </div>
          </div>
        )}

        {/* Extracted data — verify */}
        {isDataReady && !showSuccess && (
          <>
            {/* Preview thumbnail */}
            {job.file.type.startsWith('image/') && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden max-h-48">
                <img
                  src={job.previewUrl}
                  alt="Náhled"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {job.draftId && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Automaticky uloženo
              </div>
            )}

            <ExtractedDataDisplay
              data={job.extractedData!}
              documentType={job.documentType}
              confidenceScore={job.confidenceScore}
              editable={true}
              onFieldChange={handleFieldCorrection}
              corrections={job.corrections}
            />

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
              />
            </div>

            <Button className="w-full h-12 text-lg" onClick={handleSubmit}>
              <Send className="w-5 h-5 mr-2" />
              Potvrdit a odeslat
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
