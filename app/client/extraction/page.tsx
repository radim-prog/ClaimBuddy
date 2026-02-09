'use client'

import { useState, useRef, useCallback } from 'react'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { 
  DocumentTypeSelector, 
  ExtractedDataDisplay,
  ExtractionDocumentType,
  ExtractedData,
  ExtractionStatus
} from '@/components/extraction'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Send,
  Edit3,
  RotateCcw,
  Receipt,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
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
}

export default function ClientExtractionPage() {
  const { companies, loading: companiesLoading } = useClientUser()
  
  // State
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [documentType, setDocumentType] = useState<ExtractionDocumentType>('receipt')
  const [jobs, setJobs] = useState<ExtractionJob[]>([])
  const [currentJobIndex, setCurrentJobIndex] = useState<number>(-1)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const currentJob = currentJobIndex >= 0 ? jobs[currentJobIndex] : null

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const newJobs: ExtractionJob[] = Array.from(files).map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      documentType,
      status: 'uploaded',
      corrections: []
    }))

    setJobs(prev => [...prev, ...newJobs])
    if (currentJobIndex < 0) {
      setCurrentJobIndex(0)
    }

    // Auto-start extraction for each file
    newJobs.forEach(job => processExtraction(job))
  }, [documentType, currentJobIndex])

  // Process extraction via API
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
        confidenceScore: data.confidenceScore
      })
    } catch (error) {
      console.error('Extraction error:', error)
      updateJobStatus(job.id, 'error')
    } finally {
      setIsExtracting(false)
    }
  }

  // Update job status
  const updateJobStatus = (jobId: string, status: ExtractionStatus) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status } : j
    ))
  }

  // Update job data
  const updateJobData = (jobId: string, updates: Partial<ExtractionJob>) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, ...updates } : j
    ))
  }

  // Handle field correction
  const handleFieldCorrection = (field: string, value: string | number) => {
    if (!currentJob) return

    const originalValue = (currentJob.extractedData as unknown as Record<string, unknown>)?.[field]
    
    // Update extracted data
    const newData = { 
      ...currentJob.extractedData,
      [field]: value 
    } as ExtractedData

    // Track correction
    const correction = {
      field,
      original: originalValue,
      corrected: value,
      timestamp: new Date().toISOString()
    }

    updateJobData(currentJob.id, {
      extractedData: newData,
      corrections: [...currentJob.corrections, correction],
      status: 'corrected'
    })
  }

  // Submit to accountant
  const handleSubmit = async () => {
    if (!selectedCompany || jobs.length === 0) return

    setIsSubmitting(true)

    try {
      const submissionData = jobs.map(job => ({
        company_id: selectedCompany,
        file_name: job.file.name,
        document_type: job.documentType,
        extracted_data: job.extractedData,
        corrections: job.corrections,
        notes: job.notes
      }))

      const response = await fetch('/api/client/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: submissionData }),
      })

      if (!response.ok) throw new Error('Odeslání selhalo')

      setShowSuccess(true)
      // Reset after showing success
      setTimeout(() => {
        setJobs([])
        setCurrentJobIndex(-1)
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Submit error:', error)
      alert('Odeslání selhalo. Zkuste to prosím znovu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove job
  const handleRemoveJob = (jobId: string) => {
    setJobs(prev => {
      const filtered = prev.filter(j => j.id !== jobId)
      if (filtered.length === 0) {
        setCurrentJobIndex(-1)
      } else if (currentJobIndex >= filtered.length) {
        setCurrentJobIndex(filtered.length - 1)
      }
      return filtered
    })
  }

  // Retry extraction
  const handleRetry = () => {
    if (currentJob) {
      processExtraction(currentJob)
    }
  }

  // Get status icon
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

  // Loading state
  if (companiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Doklady odeslány!</h2>
            <p className="text-gray-600">
              Vaše doklady byly úspěšně odeslány k účetnímu zpracování.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Nahrát doklad
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Vyfoťte nebo nahrajte účtenky a faktury
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Company Selector */}
        <Card>
          <CardContent className="p-4">
            <Label className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" />
              Firma
            </Label>
            <Select 
              value={selectedCompany} 
              onValueChange={setSelectedCompany}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte firmu..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Document Type */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-2 block">Typ dokladu</Label>
            <DocumentTypeSelector
              value={documentType}
              onChange={setDocumentType}
            />
          </CardContent>
        </Card>

        {/* Upload Buttons - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-4">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => cameraInputRef.current?.click()}
            disabled={!selectedCompany}
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">Vyfotit</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedCompany}
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">Nahrát soubor</span>
          </Button>
        </div>

        {!selectedCompany && (
          <p className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
            Nejprve vyberte firmu
          </p>
        )}

        {/* Current Job Display */}
        {currentJob && (
          <Card className="overflow-hidden">
            {/* Preview */}
            <div className="aspect-video bg-gray-100 relative">
              {currentJob.file.type.startsWith('image/') ? (
                <img
                  src={currentJob.previewUrl}
                  alt="Náhled"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Status overlay */}
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                {getStatusIcon(currentJob.status)}
              </div>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Extraction progress */}
              {currentJob.status === 'extracting' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Probíhá vytěžování...</span>
                </div>
              )}

              {/* Error state */}
              {currentJob.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Vytěžování selhalo</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleRetry}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Zkusit znovu
                  </Button>
                </div>
              )}

              {/* Extracted Data */}
              {(currentJob.status === 'extracted' || 
                currentJob.status === 'corrected' ||
                currentJob.status === 'validated') && (
                <>
                  <ExtractedDataDisplay
                    data={currentJob.extractedData!}
                    documentType={currentJob.documentType}
                    confidenceScore={currentJob.confidenceScore}
                    editable={true}
                    onFieldChange={handleFieldCorrection}
                    corrections={currentJob.corrections}
                  />

                  {/* Notes */}
                  <div>
                    <Label className="text-sm">Poznámka pro účetní</Label>
                    <Textarea
                      placeholder="Např.: Souvisí s projektem X, služební cesta..."
                      value={currentJob.notes || ''}
                      onChange={(e) => updateJobData(currentJob.id, { notes: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job list (when multiple) */}
        {jobs.length > 1 && (
          <div className="space-y-2">
            <Label>Nahrané doklady ({jobs.length})</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {jobs.map((job, idx) => (
                <button
                  key={job.id}
                  onClick={() => setCurrentJobIndex(idx)}
                  className={cn(
                    "flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden relative",
                    idx === currentJobIndex 
                      ? "border-blue-500 ring-2 ring-blue-200" 
                      : "border-gray-200"
                  )}
                >
                  {job.file.type.startsWith('image/') ? (
                    <img
                      src={job.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-0.5 right-0.5">
                    {getStatusIcon(job.status)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveJob(job.id)
                    }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {jobs.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="max-w-3xl mx-auto">
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
                    Odeslat k účetnímu ({jobs.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
