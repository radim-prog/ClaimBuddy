'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import {
  DocumentTypeSelector,
  ExtractedDataDisplay,
  ConfidenceBadge,
  ExtractionDocumentType,
  ExtractionStatus,
  mapKimiToExtractedData
} from '@/components/extraction'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import {
  Upload,
  FileText,
  Image,
  X,
  Check,
  Loader2,
  AlertCircle,
  History,
  FileUp,
  Eye,
  Building2,
} from 'lucide-react'

type ExtractionHistoryItem = {
  id: string
  file_name: string
  file_type: 'pdf' | 'image'
  document_type: ExtractionDocumentType
  status: ExtractionStatus
  extracted_data?: any
  confidence_score?: number
  created_at: string
  updated_at: string
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function AccountantExtractionPage() {
  const { userId } = useAccountantUser()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('upload')

  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<ExtractionDocumentType>('invoice')

  const [extractionResult, setExtractionResult] = useState<{
    success: boolean
    data?: any
    confidence_score?: number
    document_type?: ExtractionDocumentType
    error?: string
    corrections?: any[]
    roundResults?: any[]
  } | null>(null)

  const [history, setHistory] = useState<ExtractionHistoryItem[]>([])
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ExtractionHistoryItem | null>(null)
  const [historyFilter, setHistoryFilter] = useState<string>('all')
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [assignCompanyId, setAssignCompanyId] = useState<string>('')

  // Fetch companies and read ?company= param from URL
  useEffect(() => {
    if (!userId) return
    // Read company from URL query param
    const params = new URLSearchParams(window.location.search)
    const companyFromUrl = params.get('company')
    if (companyFromUrl) setAssignCompanyId(companyFromUrl)

    fetch('/api/accountant/companies', {
      headers: { 'x-user-id': userId }
    })
      .then(r => r.json())
      .then(data => {
        const active = (data.companies || []).filter((c: any) => c.status !== 'inactive')
        setCompanies(active.map((c: any) => ({ id: c.id, name: c.name })))
      })
      .catch(() => {})
  }, [userId])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Nepodporovaný formát. Pouze PDF, JPG, PNG.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Soubor je příliš velký. Maximum je 10MB.'
    }
    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
      setExtractionResult(null)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
      setSelectedFile(file)
      setExtractionResult(null)
    }
  }, [])

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setExtractionResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExtract = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)
    setExtractionResult(null)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('documentType', documentType)

      const response = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: userId ? { 'x-user-id': userId } : {},
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        // Map Kimi ExtractedInvoice (nested) to frontend ExtractedData (flat)
        const mappedData = mapKimiToExtractedData(result.data)
        setExtractionResult({
          success: true,
          data: mappedData,
          confidence_score: result.data?.confidence_score,
          document_type: documentType,
          corrections: result.data?.corrections,
          roundResults: result.data?.roundResults,
        })

        const newHistoryItem: ExtractionHistoryItem = {
          id: `ext-${Date.now()}`,
          file_name: selectedFile.name,
          file_type: selectedFile.type === 'application/pdf' ? 'pdf' : 'image',
          document_type: documentType,
          status: 'extracted',
          extracted_data: result.data,
          confidence_score: result.data?.confidence_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setHistory(prev => [newHistoryItem, ...prev])

        toast.success(`Dokument ${result.data?.document_number || selectedFile.name} byl úspěšně vytěžen. (${result.processingTime}ms)`)
      } else {
        setExtractionResult({
          success: false,
          error: result.message || 'Extrakce selhala'
        })
        toast.error(result.message || 'Nepodařilo se vytěžit data z dokumentu.')
      }
    } catch {
      setExtractionResult({
        success: false,
        error: 'Chyba připojení k serveru'
      })
      toast.error('Nepodařilo se připojit k serveru.')
    } finally {
      setUploading(false)
    }
  }

  const handleViewHistoryItem = (item: ExtractionHistoryItem) => {
    setSelectedHistoryItem(item)
    setExtractionResult({
      success: true,
      data: item.extracted_data,
      confidence_score: item.confidence_score,
      document_type: item.document_type
    })
    setActiveTab('upload')
    setSelectedFile(null)
  }

  const filteredHistory = history.filter(item => {
    if (historyFilter === 'all') return true
    if (historyFilter === 'invoice') return item.document_type === 'invoice'
    if (historyFilter === 'receipt') return item.document_type === 'receipt'
    if (historyFilter === 'bank_statement') return item.document_type === 'bank_statement'
    return true
  })

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

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-10 h-10 text-red-500" />
    }
    return <Image className="w-10 h-10 text-blue-500" />
  }

  const selectedCompanyName = useMemo(() => {
    if (!assignCompanyId) return null
    return companies.find(c => c.id === assignCompanyId)?.name || null
  }, [assignCompanyId, companies])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="border-b bg-white dark:bg-gray-800 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display dark:text-white">Vytěžování dokumentů</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nahrání a automatické zpracování faktur a účtenek pomocí Kimi AI
            </p>
          </div>
          {selectedCompanyName && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              <Building2 className="h-4 w-4 mr-1.5" />
              {selectedCompanyName}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Nahrání
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Historie
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1">{history.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              A/B Porovnání
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="h-[calc(100%-3rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium font-display">Typ dokumentu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentTypeSelector
                      value={documentType}
                      onChange={setDocumentType}
                      showAll
                    />
                  </CardContent>
                </Card>

                <Card className={`border-2 border-dashed transition-colors ${
                  isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}>
                  <CardContent className="p-6">
                    {!selectedFile ? (
                      <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-center cursor-pointer py-8"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <FileUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Přetáhněte soubor sem
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          nebo klikněte pro výběr
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> PDF
                          </span>
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" /> JPG
                          </span>
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" /> PNG
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Maximum 10MB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          {getFileIcon(selectedFile)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{selectedFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelectedFile}
                            disabled={uploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {uploading && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {uploadProgress < 100 ? 'Nahrávání...' : 'Zpracování pomocí Kimi AI...'}
                              </span>
                              <span className="text-gray-500">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} />
                          </div>
                        )}

                        <Button
                          onClick={handleExtract}
                          disabled={uploading}
                          className="w-full"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Zpracovávám...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Vytěžit data
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {extractionResult && !extractionResult.success && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Chyba při zpracování</p>
                      <p className="text-sm text-red-600">{extractionResult.error}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-full">
                {extractionResult?.success && extractionResult.data ? (
                  <Card className="h-full flex flex-col">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="font-display">Vytěžená data</CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Zkontrolujte a upravte extrahované údaje
                          </p>
                        </div>
                        {extractionResult.confidence_score && (
                          <ConfidenceBadge
                            score={Math.round(extractionResult.confidence_score)}
                          />
                        )}
                        {extractionResult.corrections && extractionResult.corrections.length > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            {extractionResult.corrections.length} korekcí (3 kola)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-4">
                      <ExtractedDataDisplay
                        data={extractionResult.data}
                        documentType={extractionResult.document_type || 'invoice'}
                        editable
                      />
                    </CardContent>
                    <div className="border-t p-4 space-y-3">
                      {/* Assign to client */}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Select value={assignCompanyId || 'none'} onValueChange={v => setAssignCompanyId(v === 'none' ? '' : v)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Přiřadit ke klientovi..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nepřiřazeno</SelectItem>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => {
                          setExtractionResult(null)
                          setSelectedFile(null)
                          setAssignCompanyId('')
                          toast.info('Vytěžená data zahozena')
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          Zahodit
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={async () => {
                          if (!assignCompanyId) {
                            toast.warning('Vyberte klienta pro přiřazení dokumentu')
                            return
                          }
                          try {
                            const res = await fetch('/api/accountant/extraction/approve', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                ...(userId ? { 'x-user-id': userId } : {}),
                              },
                              body: JSON.stringify({
                                company_id: assignCompanyId,
                                action: 'approve',
                                extracted_data: extractionResult?.data,
                                file_name: selectedFile?.name || 'dokument',
                                document_type: extractionResult?.document_type || 'invoice',
                              }),
                            })
                            if (!res.ok) throw new Error('Approve failed')
                            const companyName = companies.find(c => c.id === assignCompanyId)?.name
                            toast.success(`Dokument schválen a přiřazen ke klientovi ${companyName}`)
                            setHistory(prev => [{
                              id: crypto.randomUUID(),
                              file_name: selectedFile?.name || 'dokument',
                              file_type: selectedFile?.type?.includes('pdf') ? 'pdf' : 'image',
                              document_type: extractionResult?.document_type || 'invoice',
                              status: 'approved' as ExtractionStatus,
                              extracted_data: extractionResult?.data,
                              confidence_score: extractionResult?.confidence_score,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            }, ...prev])
                            setExtractionResult(null)
                            setSelectedFile(null)
                            setAssignCompanyId('')
                          } catch {
                            toast.error('Chyba při schvalování dokumentu')
                          }
                        }}>
                          <Check className="w-4 h-4 mr-2" />
                          Schválit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400 p-8">
                      <FileText className="w-16 h-16 mx-auto mb-4" />
                      <p className="text-lg font-medium font-display">Žádná data k zobrazení</p>
                      <p className="text-sm mt-2">
                        Nahrajte dokument pro automatické vytěžení
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="h-[calc(100%-3rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              <Card className="lg:col-span-1 flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-base font-display">Naposledy vytěžené</CardTitle>
                  </div>
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtr typu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Všechny typy</SelectItem>
                      <SelectItem value="invoice">Faktury</SelectItem>
                      <SelectItem value="receipt">Účtenky</SelectItem>
                      <SelectItem value="bank_statement">Výpisy</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    {filteredHistory.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <History className="w-12 h-12 mx-auto mb-4" />
                        <p>Zatím žádná historie</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredHistory.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleViewHistoryItem(item)}
                            className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              selectedHistoryItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {item.file_type === 'pdf' ? (
                                <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
                              ) : (
                                <Image className="w-8 h-8 text-blue-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {item.file_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(item.status)}
                                  {item.confidence_score && (
                                    <ConfidenceBadge
                                      score={Math.round(item.confidence_score)}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(item.created_at).toLocaleDateString('cs-CZ')}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 flex flex-col h-full">
                <CardHeader className="border-b">
                  <CardTitle className="font-display">Detail dokumentu</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4">
                  {selectedHistoryItem?.extracted_data ? (
                    <ExtractedDataDisplay
                      data={selectedHistoryItem.extracted_data}
                      documentType={selectedHistoryItem.document_type}
                      editable
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Eye className="w-16 h-16 mx-auto mb-4" />
                        <p>Vyberte dokument z historie pro zobrazení</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="compare">
            <CompareTab userId={userId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// A/B comparison tab component
function CompareTab({ userId }: { userId: string | null }) {
  const [comparing, setComparing] = useState(false)
  const [compareFile, setCompareFile] = useState<File | null>(null)
  const [compareResult, setCompareResult] = useState<{
    filename: string
    comparison: Array<{
      model: string
      modelName: string
      success: boolean
      processingTime: number
      data?: any
      error?: string
      confidence: number
    }>
    agreementScore: number
    bestModel: { model: string; modelName: string }
  } | null>(null)

  const handleCompare = async () => {
    if (!compareFile) return
    setComparing(true)
    setCompareResult(null)
    try {
      const formData = new FormData()
      formData.append('file', compareFile)
      const res = await fetch('/api/documents/compare', { method: 'POST', headers: userId ? { 'x-user-id': userId } : {}, body: formData })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setCompareResult(data)
        toast.success('Porovnání dokončeno')
      }
    } catch {
      toast.error('Chyba při porovnávání')
    } finally {
      setComparing(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-display">A/B Porovnání Kimi modelů</CardTitle>
          <p className="text-sm text-gray-500">
            Nahrajte fakturu a porovnejte výsledky extrakce mezi modely Kimi K2.5 a Moonshot V1
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setCompareFile(e.target.files?.[0] || null)}
              className="flex-1"
            />
            <Button
              onClick={handleCompare}
              disabled={!compareFile || comparing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {comparing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Porovnávám...</>
              ) : (
                <><Eye className="h-4 w-4 mr-2" /> Porovnat modely</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {compareResult && (
        <>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Shoda mezi modely</p>
                  <p className="text-2xl font-bold">{compareResult.agreementScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nejlepší model</p>
                  <p className="text-lg font-bold text-purple-600">{compareResult.bestModel.modelName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Soubor</p>
                  <p className="text-sm font-medium">{compareResult.filename}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {compareResult.comparison.map(result => (
              <Card key={result.model} className={result.model === compareResult.bestModel.model ? 'border-purple-400 border-2' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display">{result.modelName}</CardTitle>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? `${result.confidence}%` : 'Chyba'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{result.processingTime}ms</p>
                </CardHeader>
                <CardContent>
                  {result.success && result.data ? (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-gray-500">Číslo:</span>
                        <span className="font-medium">{result.data.document_number || '-'}</span>
                        <span className="text-gray-500">VS:</span>
                        <span className="font-medium">{result.data.variable_symbol || '-'}</span>
                        <span className="text-gray-500">Dodavatel:</span>
                        <span className="font-medium">{result.data.supplier?.name || '-'}</span>
                        <span className="text-gray-500">IČO:</span>
                        <span className="font-medium">{result.data.supplier?.ico || '-'}</span>
                        <span className="text-gray-500">Bez DPH:</span>
                        <span className="font-medium">{result.data.total_without_vat?.toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-gray-500">DPH:</span>
                        <span className="font-medium">{result.data.total_vat?.toLocaleString('cs-CZ')} Kč</span>
                        <span className="text-gray-500">Celkem:</span>
                        <span className="font-bold text-lg">{result.data.total_with_vat?.toLocaleString('cs-CZ')} Kč</span>
                      </div>
                      {result.data.items?.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-1">Položky ({result.data.items.length}):</p>
                          {result.data.items.slice(0, 3).map((item: any, i: number) => (
                            <p key={i} className="text-xs truncate">{item.description} - {item.total_price?.toLocaleString('cs-CZ')} Kč</p>
                          ))}
                          {result.data.items.length > 3 && (
                            <p className="text-xs text-gray-400">...a dalších {result.data.items.length - 3}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">{result.error}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
