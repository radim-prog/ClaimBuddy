'use client'
import { Label } from "@/components/ui/label"

import { useState, useEffect, useCallback } from 'react'
import { 
  DocumentTypeSelector,
  ExtractedDataDisplay,
  ConfidenceBadge,
  ExtractionRecord,
  ExtractionDocumentType,
  AccountantExtractionMode,
  ExtractionStatus
} from '@/components/extraction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Save,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  File,
  Loader2,
  Users,
  Zap,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Inbox
} from 'lucide-react'

// Types
type DriveFolder = {
  id: string
  name: string
}

type DriveFile = {
  id: string
  name: string
  mimeType: string
}

// Mock data for client submissions (will be replaced with API)
const MOCK_SUBMISSIONS: ExtractionRecord[] = [
  {
    id: 'sub-1',
    company_id: 'comp-1',
    company_name: 'WikiPoradce s.r.o.',
    file_name: 'uctenka_lidl_2024.jpg',
    file_type: 'image',
    document_type: 'receipt',
    status: 'submitted',
    source: 'client_upload',
    extracted_data: {
      document_type: 'receipt',
      document_number: '12345',
      supplier_name: 'Lidl ČR',
      total_amount: 458.50,
      date_issued: '2024-01-15'
    },
    confidence_score: 0.85,
    submitted_by: 'user-1',
    submitted_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'sub-2',
    company_id: 'comp-2',
    company_name: 'TechStart a.s.',
    file_name: 'faktura_orlen_0124.pdf',
    file_type: 'pdf',
    document_type: 'invoice',
    status: 'submitted',
    source: 'client_upload',
    extracted_data: {
      document_type: 'invoice',
      document_number: 'F2024/0012',
      variable_symbol: '1234567890',
      supplier_name: 'ORLEN Benzina',
      supplier_ico: '12345678',
      total_without_vat: 8500.00,
      total_vat: 1785.00,
      total_amount: 10285.00,
      date_issued: '2024-01-10',
      date_due: '2024-01-24'
    },
    confidence_score: 0.92,
    submitted_by: 'user-2',
    submitted_at: '2024-01-14T14:20:00Z',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z'
  },
  {
    id: 'sub-3',
    company_id: 'comp-1',
    company_name: 'WikiPoradce s.r.o.',
    file_name: 'restaurace_paragon.jpg',
    file_type: 'image',
    document_type: 'receipt',
    status: 'submitted',
    source: 'client_upload',
    extracted_data: {
      document_type: 'receipt',
      supplier_name: 'Restaurace U Fleků',
      total_amount: 1250.00,
      date_issued: '2024-01-13'
    },
    confidence_score: 0.78,
    corrections: [{
      field: 'total_amount',
      original: 125.00,
      corrected: 1250.00,
      timestamp: '2024-01-15T11:00:00Z'
    }],
    submitted_by: 'user-1',
    submitted_at: '2024-01-13T18:45:00Z',
    created_at: '2024-01-13T18:45:00Z',
    updated_at: '2024-01-15T11:00:00Z'
  }
]

export default function AccountantExtractionPage() {
  // Mode state
  const [mode, setMode] = useState<AccountantExtractionMode>('client_submissions')
  
  // Mode A: Client submissions
  const [submissions, setSubmissions] = useState<ExtractionRecord[]>(MOCK_SUBMISSIONS)
  const [selectedSubmission, setSelectedSubmission] = useState<ExtractionRecord | null>(null)
  const [submissionFilter, setSubmissionFilter] = useState<string>('all')
  
  // Mode B: Bulk processing
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [files, setFiles] = useState<DriveFile[]>([])
  const [bulkDocumentType, setBulkDocumentType] = useState<ExtractionDocumentType>('invoice')
  const [bulkJobs, setBulkJobs] = useState<ExtractionRecord[]>([])
  const [currentBulkIndex, setCurrentBulkIndex] = useState(0)
  
  // Common state
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // Load folders on mount
  useEffect(() => {
    loadFolders()
  }, [])

  // Load files when folder selected in bulk mode
  useEffect(() => {
    if (selectedFolder && mode === 'bulk_processing') {
      loadFiles(selectedFolder)
    }
  }, [selectedFolder, mode])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/drive/folders')
      const data = await res.json()
      if (data.success) {
        setFolders(data.folders)
      } else {
        setError(data.message || 'Nepodařilo se načíst složky')
      }
    } catch {
      setError('Chyba připojení k Google Drive')
    } finally {
      setLoading(false)
    }
  }

  const loadFiles = async (folderId: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/drive/files/${folderId}`)
      const data = await res.json()
      if (data.success) {
        setFiles(data.files)
        // Create extraction jobs placeholders
        const jobs: ExtractionRecord[] = data.files.map((f: DriveFile, idx: number) => ({
          id: `bulk-${idx}`,
          company_id: 'temp',
          file_name: f.name,
          file_type: f.mimeType.includes('pdf') ? 'pdf' : 'image',
          document_type: bulkDocumentType,
          status: 'uploaded',
          source: 'drive_import',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        setBulkJobs(jobs)
        setCurrentBulkIndex(0)
      }
    } catch {
      setError('Chyba při načítání souborů')
    } finally {
      setLoading(false)
    }
  }

  // Mode A: Handle submission approval
  const handleApproveSubmission = async (generatePohoda: boolean = true) => {
    if (!selectedSubmission) return

    try {
      const res = await fetch(`/api/extractions/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          notes: reviewNotes,
          generate_pohoda: generatePohoda
        }),
      })

      if (res.ok) {
        setSubmissions(prev => prev.map(s => 
          s.id === selectedSubmission.id 
            ? { ...s, status: 'approved' as ExtractionStatus }
            : s
        ))
        setSelectedSubmission(null)
        setReviewNotes('')
      }
    } catch {
      setError('Chyba při schvalování')
    }
  }

  // Mode A: Handle submission rejection
  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return

    try {
      const res = await fetch(`/api/extractions/${selectedSubmission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          notes: reviewNotes
        }),
      })

      if (res.ok) {
        setSubmissions(prev => prev.map(s => 
          s.id === selectedSubmission.id 
            ? { ...s, status: 'rejected' as ExtractionStatus }
            : s
        ))
        setSelectedSubmission(null)
        setReviewNotes('')
      }
    } catch {
      setError('Chyba při zamítání')
    }
  }

  // Mode B: Run bulk extraction
  const handleBulkExtract = async () => {
    if (bulkJobs.length === 0) return

    setExtracting(true)
    const fileIds = files.map(f => f.id)

    try {
      const res = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds,
          documentType: bulkDocumentType,
          companyId: 'temp'
        }),
      })

      const data = await res.json()

      if (data.success) {
        const updated = bulkJobs.map((job, idx) => {
          const result = data.results[idx]
          if (result?.status === 'success') {
            return {
              ...job,
              status: 'extracted' as ExtractionStatus,
              extracted_data: result.extractedData,
              confidence_score: result.confidenceScore
            }
          }
          return job
        })
        setBulkJobs(updated)
      } else {
        setError(data.message || 'Extrakce selhala')
      }
    } catch {
      setError('Chyba při extrakci')
    } finally {
      setExtracting(false)
    }
  }

  // Mode B: Approve bulk document
  const handleApproveBulk = async () => {
    const current = bulkJobs[currentBulkIndex]
    if (!current) return

    // Move to next
    if (currentBulkIndex < bulkJobs.length - 1) {
      setCurrentBulkIndex(prev => prev + 1)
    }
  }

  // Get status badge
  const getStatusBadge = (status: ExtractionStatus) => {
    const variants: Record<string, { color: string; label: string }> = {
      submitted: { color: 'bg-blue-100 text-blue-800', label: 'Ke kontrole' },
      extracted: { color: 'bg-yellow-100 text-yellow-800', label: 'Vytěženo' },
      corrected: { color: 'bg-orange-100 text-orange-800', label: 'Opraveno' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Schváleno' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Zamítnuto' },
      error: { color: 'bg-red-100 text-red-800', label: 'Chyba' }
    }
    const config = variants[status] || { color: 'bg-gray-100', label: status }
    return (
      <Badge className={config.color} variant="outline">
        {config.label}
      </Badge>
    )
  }

  // Filtered submissions
  const filteredSubmissions = submissions.filter(s => {
    if (submissionFilter === 'all') return true
    if (submissionFilter === 'pending') return s.status === 'submitted'
    if (submissionFilter === 'approved') return s.status === 'approved'
    if (submissionFilter === 'rejected') return s.status === 'rejected'
    return true
  })

  // Current bulk job
  const currentBulkJob = bulkJobs[currentBulkIndex]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Vytěžování dokladů</h1>
          
          {/* Mode Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('client_submissions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                mode === 'client_submissions' 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Od klientů</span>
              {submissions.filter(s => s.status === 'submitted').length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {submissions.filter(s => s.status === 'submitted').length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setMode('bulk_processing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                mode === 'bulk_processing' 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Hromadné zpracování</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* MODE A: Client Submissions */}
      {mode === 'client_submissions' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Submissions list */}
          <div className="w-1/3 border-r bg-white flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <Select value={submissionFilter} onValueChange={setSubmissionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtr" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny</SelectItem>
                    <SelectItem value="pending">Ke kontrole</SelectItem>
                    <SelectItem value="approved">Schválené</SelectItem>
                    <SelectItem value="rejected">Zamítnuté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500">
                {filteredSubmissions.length} dokladů
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filteredSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedSubmission?.id === submission.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {submission.company_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {submission.file_name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(submission.status)}
                          {submission.corrections && submission.corrections.length > 0 && (
                            <Badge variant="outline" className="text-amber-600">
                              Opraveno
                            </Badge>
                          )}
                        </div>
                      </div>
                      {submission.confidence_score && (
                        <ConfidenceBadge 
                          score={Math.round(submission.confidence_score * 100)} 
                          size="sm"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Detail view */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {selectedSubmission ? (
              <>
                {/* Preview area */}
                <div className="flex-1 p-4">
                  <Card className="h-full">
                    <CardContent className="p-0 h-full flex items-center justify-center bg-gray-100">
                      {selectedSubmission.file_type === 'image' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-24 h-24 text-gray-300" />
                          <span className="ml-4 text-gray-400">Náhled obrázku</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-24 h-24 text-gray-300" />
                          <span className="ml-4 text-gray-400">PDF náhled</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Data review panel */}
                <div className="h-96 bg-white border-t">
                  <div className="h-full flex">
                    {/* Extracted data */}
                    <div className="flex-1 p-4 overflow-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Vytěžená data</h3>
                        <div className="flex items-center gap-2">
                          <DocumentTypeSelector
                            value={selectedSubmission.document_type}
                            onChange={() => {}}
                            disabled
                          />
                          {selectedSubmission.confidence_score && (
                            <ConfidenceBadge 
                              score={Math.round(selectedSubmission.confidence_score * 100)} 
                            />
                          )}
                        </div>
                      </div>
                      
                      {selectedSubmission.extracted_data && (
                        <ExtractedDataDisplay
                          data={selectedSubmission.extracted_data}
                          documentType={selectedSubmission.document_type}
                          editable={selectedSubmission.status === 'submitted'}
                          corrections={selectedSubmission.corrections}
                        />
                      )}
                    </div>

                    {/* Actions */}
                    {selectedSubmission.status === 'submitted' && (
                      <div className="w-80 border-l p-4 space-y-4">
                        <div>
                          <label className="text-sm font-medium">Poznámka</label>
                          <Textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Interní poznámka..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveSubmission(true)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Schválit + Pohoda
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleApproveSubmission(false)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Jen schválit
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleRejectSubmission}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Zamítnout
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Inbox className="w-16 h-16 mx-auto mb-4" />
                  <p>Vyberte doklad ke kontrole</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE B: Bulk Processing */}
      {mode === 'bulk_processing' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Controls & File list */}
          <div className="w-80 border-r bg-white flex flex-col">
            <div className="p-4 border-b space-y-4">
              {/* Folder selector */}
              <div>
                <Label className="text-sm font-medium">Složka Google Drive</Label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger className="mt-1">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Vyberte složku..." />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Document type */}
              <div>
                <Label className="text-sm font-medium">Typ dokladu</Label>
                <DocumentTypeSelector
                  value={bulkDocumentType}
                  onChange={setBulkDocumentType}
                  showAll
                />
              </div>

              {/* Extract button */}
              <Button
                onClick={handleBulkExtract}
                disabled={extracting || files.length === 0}
                className="w-full"
              >
                {extracting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extrahuji...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Spustit OCR</>
                )}
              </Button>
            </div>

            {/* File list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {bulkJobs.map((job, idx) => (
                  <button
                    key={job.id}
                    onClick={() => setCurrentBulkIndex(idx)}
                    className={`w-full p-2 text-left rounded-md text-sm ${
                      idx === currentBulkIndex 
                        ? 'bg-blue-100 text-blue-900' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {job.status === 'extracted' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : job.status === 'extracting' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <File className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="truncate">{job.file_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            {/* Progress */}
            {bulkJobs.length > 0 && (
              <div className="p-4 border-t">
                <div className="text-sm text-center text-gray-600">
                  {currentBulkIndex + 1} / {bulkJobs.length}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview & Data */}
          <div className="flex-1 flex flex-col">
            {currentBulkJob ? (
              <>
                {/* Preview */}
                <div className="flex-1 bg-gray-100 p-4">
                  <div className="h-full flex items-center justify-center">
                    <FileText className="w-24 h-24 text-gray-300" />
                    <span className="ml-4 text-gray-500">{currentBulkJob.file_name}</span>
                  </div>
                </div>

                {/* Data panel */}
                <div className="h-80 bg-white border-t p-4">
                  {currentBulkJob.extracted_data ? (
                    <ExtractedDataDisplay
                      data={currentBulkJob.extracted_data}
                      documentType={currentBulkJob.document_type}
                      confidenceScore={currentBulkJob.confidence_score}
                      editable
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      {currentBulkJob.status === 'extracting' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Probíhá vytěžování...</span>
                        </div>
                      ) : (
                        <span>Spusťte OCR pro vytěžení dat</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="border-t p-4 flex items-center justify-between bg-white">
                  <Button
                    variant="outline"
                    disabled={currentBulkIndex === 0}
                    onClick={() => setCurrentBulkIndex(prev => prev - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Předchozí
                  </Button>
                  
                  {currentBulkJob.extracted_data && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleApproveBulk}>
                        <ThumbsUp className="w-4 h-4 mr-2" /> Schválit
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    disabled={currentBulkIndex >= bulkJobs.length - 1}
                    onClick={() => setCurrentBulkIndex(prev => prev + 1)}
                  >
                    Další <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4" />
                  <p>Vyberte složku se soubory</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
