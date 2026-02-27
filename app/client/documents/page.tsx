'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Camera,
  Upload,
  FileText,
  Landmark,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  Edit3,
  RotateCcw,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClientUser } from '@/lib/contexts/client-user-context'
import {
  DocumentTypeSelector,
  ExtractedDataDisplay,
  ExtractionDocumentType,
  ExtractedData,
  ExtractionStatus,
} from '@/components/extraction'
import { DocumentComments } from '@/components/documents/document-comments'
import { toast } from 'sonner'

type Tab = 'upload' | 'list'

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doklady</h1>
        <p className="text-muted-foreground">Nahrajte nové doklady nebo prohlížejte existující</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center',
            activeTab === 'upload'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <Camera className="h-4 w-4" />
          Nahrát
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center',
            activeTab === 'list'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
          )}
        >
          <FileText className="h-4 w-4" />
          Přehled
        </button>
      </div>

      {activeTab === 'upload' && <UploadTab />}
      {activeTab === 'list' && <DocumentListTab />}
    </div>
  )
}

// ===== UPLOAD TAB =====

interface ExtractionJob {
  id: string
  file: File
  previewUrl: string
  documentType: ExtractionDocumentType
  status: ExtractionStatus
  extractedData?: ExtractedData
  confidenceScore?: number
  corrections: Array<{ field: string; original: unknown; corrected: unknown }>
  notes?: string
  draftId?: string // ID from DB after auto-save
}

function UploadTab() {
  const { companies, loading: companiesLoading } = useClientUser()

  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [documentType, setDocumentType] = useState<ExtractionDocumentType>('receipt')
  const [jobs, setJobs] = useState<ExtractionJob[]>([])
  const [currentJobIndex, setCurrentJobIndex] = useState<number>(-1)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const currentJob = currentJobIndex >= 0 ? jobs[currentJobIndex] : null

  // Auto-select company if only 1
  useEffect(() => {
    if (companies.length === 1 && !selectedCompany) {
      setSelectedCompany(companies[0].id)
    }
  }, [companies, selectedCompany])

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const newJobs: ExtractionJob[] = Array.from(files).map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      documentType,
      status: 'uploaded' as ExtractionStatus,
      corrections: [],
    }))

    setJobs(prev => [...prev, ...newJobs])
    if (currentJobIndex < 0) {
      setCurrentJobIndex(0)
    }

    // Auto-start extraction for each file
    newJobs.forEach(job => processExtraction(job))
  }, [documentType, currentJobIndex])

  // Process OCR extraction via API
  const processExtraction = async (job: ExtractionJob) => {
    setIsExtracting(true)
    updateJobStatus(job.id, 'extracting')

    try {
      const formData = new FormData()
      formData.append('file', job.file)
      formData.append('documentType', job.documentType)
      formData.append('companyId', selectedCompany)

      const response = await fetch('/api/client/extract', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Extrakce selhala')

      const data = await response.json()

      updateJobData(job.id, {
        status: 'extracted',
        extractedData: data.extractedData,
        confidenceScore: data.confidenceScore,
        corrections: (data.corrections || []).map((c: any) => ({
          field: c.field,
          original: c.originalValue,
          corrected: c.correctedValue,
        })),
      })

      // Auto-save draft after extraction
      saveDraft(job.id, data.extractedData, selectedCompany, job.file.name, job.documentType)
    } catch (error) {
      console.error('Extraction error:', error)
      updateJobStatus(job.id, 'error')
    } finally {
      setIsExtracting(false)
    }
  }

  // Save draft to DB
  const saveDraft = async (
    jobId: string,
    extractedData: ExtractedData,
    companyId: string,
    fileName: string,
    docType: ExtractionDocumentType
  ) => {
    try {
      const res = await fetch('/api/client/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          file_name: fileName,
          document_type: docType,
          extracted_data: extractedData,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          updateJobData(jobId, { draftId: data.id })
          toast.success('Automaticky uloženo', { duration: 2000 })
        }
      }
    } catch {
      // Silent fail for auto-save
    }
  }

  // Debounced update of draft
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

  const updateJobStatus = (jobId: string, status: ExtractionStatus) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j))
  }

  const updateJobData = (jobId: string, updates: Partial<ExtractionJob>) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates } : j))
  }

  // Handle field correction
  const handleFieldCorrection = (field: string, value: string | number) => {
    if (!currentJob) return

    const originalValue = (currentJob.extractedData as unknown as Record<string, unknown>)?.[field]
    const newData = { ...currentJob.extractedData, [field]: value } as ExtractedData
    const correction = { field, original: originalValue, corrected: value }

    updateJobData(currentJob.id, {
      extractedData: newData,
      corrections: [...currentJob.corrections, correction],
      status: 'corrected',
    })

    // Auto-save correction
    if (currentJob.draftId) {
      debouncedUpdateDraft(currentJob.draftId, newData, currentJob.notes)
    }
  }

  // Submit to accountant
  const handleSubmit = async () => {
    if (!selectedCompany || jobs.length === 0) return
    setIsSubmitting(true)

    try {
      // For jobs with draft IDs, update status to submitted
      const draftJobs = jobs.filter(j => j.draftId)
      const nonDraftJobs = jobs.filter(j => !j.draftId)

      // Update drafts to submitted
      for (const job of draftJobs) {
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

      // Submit non-draft jobs via submissions API
      if (nonDraftJobs.length > 0) {
        const submissionData = nonDraftJobs.map(job => ({
          company_id: selectedCompany,
          file_name: job.file.name,
          document_type: job.documentType,
          extracted_data: job.extractedData,
          corrections: job.corrections,
          notes: job.notes,
        }))

        await fetch('/api/client/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissions: submissionData }),
        })
      }

      setShowSuccess(true)
      setTimeout(() => {
        setJobs([])
        setCurrentJobIndex(-1)
        setShowSuccess(false)
      }, 3000)
    } catch {
      toast.error('Odeslání selhalo. Zkuste to prosím znovu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveJob = (jobId: string) => {
    setJobs(prev => {
      const filtered = prev.filter(j => j.id !== jobId)
      if (filtered.length === 0) setCurrentJobIndex(-1)
      else if (currentJobIndex >= filtered.length) setCurrentJobIndex(filtered.length - 1)
      return filtered
    })
  }

  const handleRetry = () => {
    if (currentJob) processExtraction(currentJob)
  }

  const getStatusIcon = (status: ExtractionStatus) => {
    switch (status) {
      case 'approved':
      case 'submitted':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'extracted':
      case 'validated':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />
      case 'corrected':
        return <Edit3 className="w-4 h-4 text-amber-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'extracting':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      default:
        return <Upload className="w-4 h-4 text-gray-400" />
    }
  }

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (showSuccess) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6 pb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Doklady odeslány!</h2>
          <p className="text-muted-foreground">
            Vaše doklady byly úspěšně odeslány k účetnímu zpracování.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Company selector (only if multiple) */}
      {companies.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <Label className="mb-2 block">Firma</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte firmu..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Upload buttons — camera primary */}
      <div className="space-y-3">
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
          multiple
          className="hidden"
          onChange={(e) => { handleFileSelect(e.target.files); e.target.value = '' }}
        />

        <Button
          className="w-full h-16 text-lg gap-3"
          onClick={() => cameraInputRef.current?.click()}
          disabled={!selectedCompany}
        >
          <Camera className="w-6 h-6" />
          Vyfotit doklad
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedCompany}
        >
          <Upload className="w-5 h-5" />
          Nahrát ze souboru
        </Button>
      </div>

      {!selectedCompany && companies.length > 1 && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
          Nejprve vyberte firmu
        </p>
      )}

      {/* Current job display */}
      {currentJob && (
        <Card className="overflow-hidden">
          {/* Preview */}
          <div className="aspect-video bg-muted relative max-h-64">
            {currentJob.file.type.startsWith('image/') ? (
              <img
                src={currentJob.previewUrl}
                alt="Náhled"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow">
              {getStatusIcon(currentJob.status)}
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {currentJob.status === 'extracting' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Probíhá vytěžování...</span>
              </div>
            )}

            {currentJob.status === 'error' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Vytěžování selhalo</span>
                </div>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Zkusit znovu
                </Button>
              </div>
            )}

            {(currentJob.status === 'extracted' ||
              currentJob.status === 'corrected' ||
              currentJob.status === 'validated') && (
              <>
                {currentJob.draftId && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Automaticky uloženo
                  </div>
                )}

                <ExtractedDataDisplay
                  data={currentJob.extractedData!}
                  documentType={currentJob.documentType}
                  confidenceScore={currentJob.confidenceScore}
                  editable={true}
                  onFieldChange={handleFieldCorrection}
                  corrections={currentJob.corrections}
                />

                <div>
                  <Label className="text-sm">Poznámka pro účetní</Label>
                  <Textarea
                    placeholder="Např.: Souvisí s projektem X, služební cesta..."
                    value={currentJob.notes || ''}
                    onChange={(e) => {
                      updateJobData(currentJob.id, { notes: e.target.value })
                      if (currentJob.draftId) {
                        debouncedUpdateDraft(currentJob.draftId, currentJob.extractedData!, e.target.value)
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multi-job thumbnails */}
      {jobs.length > 1 && (
        <div className="space-y-2">
          <Label>Nahrané doklady ({jobs.length})</Label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {jobs.map((job, idx) => (
              <button
                key={job.id}
                onClick={() => setCurrentJobIndex(idx)}
                className={cn(
                  'flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden relative',
                  idx === currentJobIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 dark:border-gray-700'
                )}
              >
                {job.file.type.startsWith('image/') ? (
                  <img src={job.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-0.5 right-0.5">{getStatusIcon(job.status)}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveJob(job.id) }}
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      {jobs.length > 0 && (
        <Button
          className="w-full h-12 text-lg"
          disabled={isSubmitting || isExtracting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Odesílání...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Potvrdit a odeslat ({jobs.length})
            </>
          )}
        </Button>
      )}
    </div>
  )
}

// ===== DOCUMENT LIST TAB =====

interface Document {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  ocr_status?: string
  uploaded_at: string
  storage_path: string | null
}

const typeLabels: Record<string, { label: string; icon: typeof FileText }> = {
  bank_statement: { label: 'Výpis z banky', icon: Landmark },
  expense_invoice: { label: 'Nákladový doklad', icon: Receipt },
  income_invoice: { label: 'Příjmová faktura', icon: FileText },
  invoice: { label: 'Faktura', icon: Receipt },
  receipt: { label: 'Účtenka', icon: Receipt },
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const statusLabels: Record<string, string> = {
  uploaded: 'Nahráno',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  pending: 'Čeká',
  draft: 'Nepotvrzeno',
  submitted: 'Odesláno',
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ListFilter = 'all' | 'draft' | 'submitted' | 'approved'

function DocumentListTab() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [filter, setFilter] = useState<ListFilter>('all')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/documents')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const filtered = documents.filter(doc => {
    if (filter === 'all') return true
    const docStatus = doc.ocr_status || doc.status
    return docStatus === filter
  })

  const draftCount = documents.filter(d => (d.ocr_status || d.status) === 'draft').length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'draft', 'submitted', 'approved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f === 'all' ? 'Vše' : f === 'draft' ? `Nepotvrzeno (${draftCount})` : f === 'submitted' ? 'Odesláno' : 'Schváleno'}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={fetchDocs} className="ml-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading && documents.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné dokumenty</p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(doc => {
            const typeInfo = typeLabels[doc.type] || { label: doc.type, icon: FileText }
            const Icon = typeInfo.icon
            const isSelected = selectedDoc?.id === doc.id
            const docStatus = doc.ocr_status || doc.status

            return (
              <Card
                key={doc.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50',
                  docStatus === 'draft' && 'border-amber-300 dark:border-amber-700'
                )}
                onClick={() => setSelectedDoc(isSelected ? null : doc)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{typeInfo.label}</span>
                        {doc.period && <><span>·</span><span>{doc.period}</span></>}
                        {doc.file_size_bytes > 0 && <><span>·</span><span>{formatSize(doc.file_size_bytes)}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {doc.storage_path && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Náhled"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/documents/${doc.id}/download`)
                              if (res.ok) {
                                const data = await res.json()
                                const a = document.createElement('a')
                                a.href = data.url
                                a.download = data.file_name || doc.file_name
                                a.click()
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Stáhnout"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <Badge className={statusColors[docStatus] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[docStatus] || docStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(doc.uploaded_at).toLocaleDateString('cs-CZ')}
                      </span>
                      <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isSelected && 'rotate-90')} />
                    </div>
                  </div>
                </CardContent>

                {isSelected && (
                  <div className="px-4 pb-4 border-t" onClick={(e) => e.stopPropagation()}>
                    <div className="pt-4">
                      <DocumentComments documentId={doc.id} userRole="client" />
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
