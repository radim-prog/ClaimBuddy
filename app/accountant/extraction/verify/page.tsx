'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfidenceBadge } from '@/components/extraction/ConfidenceBadge'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCheck,
  AlertTriangle,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Download,
  ArrowLeft,
  BookOpen,
  ChevronDown,
} from 'lucide-react'

type VerifyDocument = {
  id: string
  company_id: string
  company_name: string
  file_name: string
  storage_path: string
  status: string
  ocr_data: any
  ocr_status: string
  mime_type: string
}

type Category = 'all' | 'ok' | 'warnings' | 'errors'

type FieldDef = {
  key: string
  label: string
  path: string[] // JSON path to access nested fields
  type: 'text' | 'date' | 'number'
  required?: boolean
}

type JournalEntry = {
  id: string
  line_number: number
  description: string
  amount: number
  vat_amount: number
  debit_account: string
  debit_name?: string
  credit_account: string
  credit_name?: string
  confidence: number | null
  status: string
}

const VERIFY_FIELDS: FieldDef[] = [
  { key: 'document_number', label: 'Číslo dokladu', path: ['document_number'], type: 'text', required: true },
  { key: 'variable_symbol', label: 'Variabilní symbol', path: ['variable_symbol'], type: 'text' },
  { key: 'date_issued', label: 'Datum vystavení', path: ['date_issued'], type: 'date', required: true },
  { key: 'date_due', label: 'Datum splatnosti', path: ['date_due'], type: 'date' },
  { key: 'date_tax', label: 'DUZP', path: ['date_tax'], type: 'date' },
  { key: 'supplier_name', label: 'Dodavatel', path: ['supplier', 'name'], type: 'text', required: true },
  { key: 'supplier_ico', label: 'IČO', path: ['supplier', 'ico'], type: 'text' },
  { key: 'supplier_dic', label: 'DIČ', path: ['supplier', 'dic'], type: 'text' },
  { key: 'supplier_street', label: 'Ulice', path: ['supplier', 'street'], type: 'text' },
  { key: 'supplier_city', label: 'Město', path: ['supplier', 'city'], type: 'text' },
  { key: 'supplier_zip', label: 'PSČ', path: ['supplier', 'zip'], type: 'text' },
  { key: 'supplier_bank_account', label: 'Číslo účtu', path: ['supplier', 'bank_account'], type: 'text' },
  { key: 'total_without_vat', label: 'Základ DPH', path: ['total_without_vat'], type: 'number' },
  { key: 'total_vat', label: 'DPH', path: ['total_vat'], type: 'number' },
  { key: 'total_with_vat', label: 'Celkem s DPH', path: ['total_with_vat'], type: 'number', required: true },
  { key: 'currency', label: 'Měna', path: ['currency'], type: 'text' },
]

function getNestedValue(obj: any, path: string[]): any {
  let current = obj
  for (const key of path) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

function setNestedValue(obj: any, path: string[], value: any): any {
  const result = { ...obj }
  if (path.length === 1) {
    result[path[0]] = value
    return result
  }
  result[path[0]] = setNestedValue(result[path[0]] || {}, path.slice(1), value)
  return result
}

function getDocCategory(doc: VerifyDocument): 'ok' | 'warnings' | 'errors' {
  if (doc.ocr_status === 'error') return 'errors'
  const score = doc.ocr_data?.confidence_score
  if (score === undefined || score === null || score < 50) return 'errors'
  if (score < 80) return 'warnings'
  return 'ok'
}

const CATEGORY_COLORS: Record<Category, string> = {
  all: '',
  ok: 'border-l-green-500',
  warnings: 'border-l-amber-500',
  errors: 'border-l-red-500',
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <VerificationPageContent />
    </Suspense>
  )
}

function VerificationPageContent() {
  const { userId } = useAccountantUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [allDocuments, setAllDocuments] = useState<VerifyDocument[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editedData, setEditedData] = useState<any>(null)
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [approving, setApproving] = useState(false)
  const [reextracting, setReextracting] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingPredkontace, setLoadingPredkontace] = useState(false)
  const [showPredkontace, setShowPredkontace] = useState(false)

  // Auto-hide sidebar on enter, restore on leave
  useEffect(() => {
    const prev = localStorage.getItem('accountant-sidebar-collapsed')
    localStorage.setItem('accountant-sidebar-collapsed', 'true')
    window.dispatchEvent(new Event('sidebar-toggle'))
    return () => {
      localStorage.setItem('accountant-sidebar-collapsed', prev || 'false')
      window.dispatchEvent(new Event('sidebar-toggle'))
    }
  }, [])

  const category = (searchParams.get('category') as Category) || 'all'

  const setCategory = (cat: Category) => {
    const params = new URLSearchParams(searchParams.toString())
    if (cat === 'all') {
      params.delete('category')
    } else {
      params.set('category', cat)
    }
    params.delete('doc')
    router.replace(`/accountant/extraction/verify?${params.toString()}`)
  }

  // Filter documents by category
  const documents = useMemo(() => {
    if (category === 'all') return allDocuments
    return allDocuments.filter(d => getDocCategory(d) === category)
  }, [allDocuments, category])

  // Category counts
  const counts = useMemo(() => ({
    all: allDocuments.length,
    ok: allDocuments.filter(d => getDocCategory(d) === 'ok').length,
    warnings: allDocuments.filter(d => getDocCategory(d) === 'warnings').length,
    errors: allDocuments.filter(d => getDocCategory(d) === 'errors').length,
  }), [allDocuments])

  const currentDoc = documents[currentIndex]

  const fetchDocuments = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/verify', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        const docs = data.documents || []
        setAllDocuments(docs)

        // Handle ?doc= param for direct navigation
        const docId = searchParams.get('doc')
        if (docId && docs.length > 0) {
          const idx = docs.findIndex((d: VerifyDocument) => d.id === docId)
          if (idx >= 0) {
            setCurrentIndex(idx)
            setEditedData(docs[idx].ocr_data)
          } else if (docs.length > 0) {
            setEditedData(docs[0].ocr_data)
          }
        } else if (docs.length > 0) {
          setEditedData(docs[0].ocr_data)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0)
    if (documents.length > 0) {
      setEditedData(documents[0].ocr_data)
    }
  }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentDoc) return
    // Auto-parse address into street/city/zip if needed
    let data = currentDoc.ocr_data
    if (data?.supplier?.address && !data?.supplier?.street) {
      const addr = data.supplier.address
      const parts = addr.split(',').map((s: string) => s.trim())
      const supplier = { ...data.supplier }
      if (parts.length >= 2) {
        supplier.street = parts[0]
        const cityPart = parts[parts.length - 1]
        const zipMatch = cityPart.match(/^(\d{3}\s?\d{2})\s+(.+)$/)
        if (zipMatch) {
          supplier.zip = zipMatch[1].replace(/\s/g, '')
          supplier.city = zipMatch[2]
        } else {
          supplier.city = cityPart
        }
      } else {
        supplier.street = addr
      }
      data = { ...data, supplier }
    }
    setEditedData(data)
    setHighlightedField(null)

    // Get file URL for viewer
    fetch(`/api/documents/${currentDoc.id}/download`, {
      headers: { 'x-user-id': userId || '' },
    })
      .then(r => r.json())
      .then(data => setFileUrl(data.url || null))
      .catch(() => setFileUrl(null))
  }, [currentDoc, userId])

  // Auto-load predkontace entries
  useEffect(() => {
    if (!currentDoc) return
    const load = async () => {
      try {
        const res = await fetch(`/api/documents/predkontace?document_id=${currentDoc.id}`)
        if (res.ok) {
          const data = await res.json()
          const entries = data.entries || []
          if (entries.length > 0) {
            setJournalEntries(entries)
            setShowPredkontace(true)
          } else {
            setJournalEntries([])
            setShowPredkontace(false)
          }
        }
      } catch { /* ignore */ }
    }
    load()
  }, [currentDoc?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeneratePredkontace = async () => {
    if (!currentDoc) return
    setLoadingPredkontace(true)
    setShowPredkontace(true)
    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: currentDoc.id }),
      })
      if (res.ok) {
        const data = await res.json()
        setJournalEntries(data.suggested_entries || [])
        toast.success('Předkontace vygenerována')
      } else {
        toast.error('Chyba při generování předkontace')
      }
    } catch {
      toast.error('Chyba při generování předkontace')
    }
    setLoadingPredkontace(false)
  }

  const handleEntryAction = async (entryId: string, action: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/documents/predkontace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, status: action }),
      })
      if (res.ok) {
        setJournalEntries(prev => prev.map(e =>
          e.id === entryId ? { ...e, status: action } : e
        ))
        toast.success(action === 'approved' ? 'Schváleno' : 'Zamítnuto')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleApproveAllEntries = async () => {
    const suggested = journalEntries.filter(e => e.status === 'suggested')
    for (const entry of suggested) {
      await handleEntryAction(entry.id, 'approved')
    }
  }

  const navigateDoc = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentIndex - 1)
      : Math.min(documents.length - 1, currentIndex + 1)
    setCurrentIndex(newIndex)
  }

  const handleFieldChange = (field: FieldDef, value: string) => {
    if (!editedData) return
    const newData = setNestedValue(editedData, field.path, value)
    setEditedData(newData)
  }

  const getFieldConfidence = (key: string): 'green' | 'orange' | 'white' => {
    if (!editedData) return 'white'
    const fieldConf = editedData.field_confidence?.[key]
    if (fieldConf === undefined) return 'white'
    if (fieldConf >= 80) return 'green'
    if (fieldConf >= 50) return 'orange'
    return 'white'
  }

  const handleApprove = async () => {
    if (!currentDoc || !userId) return
    setApproving(true)
    try {
      const res = await fetch(`/api/extraction/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          documentId: currentDoc.id,
          editedData,
          action: 'approve',
        }),
      })
      if (res.ok) {
        toast.success(`Doklad ${editedData?.document_number || currentDoc.file_name} schválen`)
        const newDocs = allDocuments.filter(d => d.id !== currentDoc.id)
        setAllDocuments(newDocs)
        if (currentIndex >= documents.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1))
      } else {
        toast.error('Chyba při schvalování')
      }
    } catch {
      toast.error('Chyba připojení')
    } finally {
      setApproving(false)
    }
  }

  const handleApproveAllFiltered = async () => {
    const docsToApprove = category === 'ok' ? documents : documents
    if (!confirm(`Schválit ${docsToApprove.length} dokladů?`)) return
    for (const doc of docsToApprove) {
      try {
        await fetch(`/api/extraction/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify({
            documentId: doc.id,
            editedData: doc.ocr_data,
            action: 'approve',
          }),
        })
      } catch {
        // continue
      }
    }
    toast.success(`${docsToApprove.length} dokladů schváleno`)
    const approvedIds = new Set(docsToApprove.map(d => d.id))
    setAllDocuments(prev => prev.filter(d => !approvedIds.has(d.id)))
    setCurrentIndex(0)
  }

  const handleReextract = async () => {
    if (!currentDoc || !userId) return
    setReextracting(true)
    try {
      const res = await fetch('/api/extraction/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          documentIds: [currentDoc.id],
          fastMode: false,
        }),
      })
      if (res.ok) {
        toast.success('Doklad odeslán k opětovnému vytěžení')
        const newDocs = allDocuments.filter(d => d.id !== currentDoc.id)
        setAllDocuments(newDocs)
        if (currentIndex >= documents.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1))
      } else {
        toast.error('Chyba při odesílání')
      }
    } catch {
      toast.error('Chyba připojení')
    } finally {
      setReextracting(false)
    }
  }

  const handleExportPohoda = async () => {
    if (!currentDoc || !userId) return
    try {
      const url = `/api/accountant/companies/${currentDoc.company_id}/documents/export-pohoda?ids=${currentDoc.id}`
      const res = await fetch(url, { headers: { 'x-user-id': userId } })
      if (res.ok) {
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `pohoda-${currentDoc.file_name.replace(/\.[^.]+$/, '')}.xml`
        a.click()
        URL.revokeObjectURL(a.href)
        toast.success('Pohoda XML exportováno')
      } else {
        toast.error('Chyba při exportu')
      }
    } catch {
      toast.error('Chyba připojení')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (allDocuments.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Check className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
        <p className="text-lg font-medium">Vše schváleno</p>
        <p className="text-sm mt-1">Žádné doklady nečekají na verifikaci</p>
      </div>
    )
  }

  const confidenceFieldClasses = {
    green: 'border-green-300 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800',
    orange: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700',
    white: 'border-border',
  }

  const currentCategory = currentDoc ? getDocCategory(currentDoc) : 'ok'

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Empty state for filtered view */}
      {documents.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Žádné doklady v této kategorii</p>
          <button
            onClick={() => setCategory('all')}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            Zobrazit vše
          </button>
        </div>
      )}

      {documents.length > 0 && (
        <>
          {/* Combined single-line bar: nav + category pills + file info + actions */}
          <div className="flex items-center justify-between py-1.5 border-b mb-2 gap-2 min-h-[36px]">
            <div className="flex items-center gap-2 min-w-0">
              {/* Back + Navigation */}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => {
                  if (window.history.length > 1) router.back()
                  else router.push('/accountant/extraction/clients')
                }}
                title="Zpět"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <div className="w-px h-5 bg-border flex-shrink-0" />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => navigateDoc('prev')}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-medium tabular-nums min-w-[32px] text-center">
                  {currentIndex + 1}/{documents.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => navigateDoc('next')}
                  disabled={currentIndex === documents.length - 1}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="w-px h-5 bg-border flex-shrink-0" />

              {/* Category pills */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {([
                  { value: 'all' as Category, label: 'Vše', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
                  { value: 'ok' as Category, label: 'OK', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
                  { value: 'warnings' as Category, label: 'Var.', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
                  { value: 'errors' as Category, label: 'Err', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
                ]).map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() => setCategory(pill.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      category === pill.value
                        ? `${pill.color} ring-2 ring-offset-1 ring-blue-500`
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {pill.label}({counts[pill.value]})
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border flex-shrink-0" />

              {/* File info */}
              <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                {currentDoc?.company_name} — {currentDoc?.file_name}
              </span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {editedData?.confidence_score && (
                <ConfidenceBadge score={Math.round(editedData.confidence_score)} />
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleExportPohoda}
                title="Export Pohoda XML"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Pohoda
              </Button>

              {category === 'ok' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                  onClick={handleApproveAllFiltered}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Vše OK({counts.ok})
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleApproveAllFiltered}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Vše({documents.length})
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={handleReextract}
                disabled={reextracting}
                size="sm"
                className="h-7 text-xs"
              >
                {reextracting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                Znovu
              </Button>

              <Button
                onClick={handleApprove}
                disabled={approving}
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
              >
                {approving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Schválit
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  toast.info('Doklad označen jako problém')
                  const newDocs = allDocuments.filter(d => d.id !== currentDoc.id)
                  setAllDocuments(newDocs)
                  if (currentIndex >= documents.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1))
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Problém
              </Button>
            </div>
          </div>

          {/* Split screen — 2:1 ratio */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 min-h-0">
            {/* LEFT: Document viewer */}
            <Card className={`flex flex-col min-h-0 overflow-hidden border-l-4 ${CATEGORY_COLORS[currentCategory] || ''}`}>
              <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Dokument</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.max(50, z - 25))}>
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-[11px] w-8 text-center tabular-nums">{zoom}%</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(100)}>
                    <RotateCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div ref={viewerRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
                {fileUrl ? (
                  currentDoc?.mime_type === 'application/pdf' ? (
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0 rounded"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={fileUrl}
                        alt={currentDoc?.file_name}
                        className="max-w-full rounded shadow-lg"
                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                      />
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Načítání dokumentu...</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* RIGHT: Form */}
            <Card className="flex flex-col min-h-0 min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
              <div className="px-2 py-1.5 border-b bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Vytěžená data</span>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Jisté
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Nejisté
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-2 space-y-1.5">
                  {VERIFY_FIELDS.map((field) => {
                    const value = getNestedValue(editedData, field.path)
                    const conf = getFieldConfidence(field.key)
                    const isHighlighted = highlightedField === field.key

                    return (
                      <div
                        key={field.key}
                        className={`group ${isHighlighted ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                        onFocus={() => setHighlightedField(field.key)}
                      >
                        <Label className="text-[11px] text-muted-foreground flex items-center gap-1 mb-0.5">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type={field.type === 'date' ? 'date' : 'text'}
                          value={value ?? ''}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          className={`h-7 text-sm max-w-full ${confidenceFieldClasses[conf]}`}
                        />
                      </div>
                    )
                  })}

                  {/* Items section */}
                  {editedData?.items?.length > 0 && (
                    <div className="pt-1.5 border-t mt-2">
                      <Label className="text-[11px] text-muted-foreground mb-1 block">
                        Položky ({editedData.items.length})
                      </Label>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="text-left py-1 pr-1">Popis</th>
                              <th className="text-right py-1 px-1">Mn.</th>
                              <th className="text-right py-1 px-1">Cena/ks</th>
                              <th className="text-right py-1 px-1">Základ</th>
                              <th className="text-right py-1 px-1">DPH</th>
                              <th className="text-right py-1 px-1">Celkem</th>
                              <th className="text-right py-1 pl-1">Sazba</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editedData.items.map((item: any, i: number) => {
                              const totalWith = Number(item.total_price || 0)
                              const totalWithout = Number(item.total_without_vat || item.base_price || 0)
                              const vatAmount = totalWith - totalWithout
                              const unitPrice = Number(item.unit_price || 0)
                              const vatRate = typeof item.vat_rate === 'number'
                                ? `${item.vat_rate}%`
                                : item.vat_rate === 'none' ? '0%' : item.vat_rate === 'low' ? '12%' : '21%'
                              return (
                                <tr key={i} className="border-b border-muted/50">
                                  <td className="py-1 pr-1 max-w-[120px] truncate">{item.description || '-'}</td>
                                  <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{item.quantity || ''}</td>
                                  <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{unitPrice ? unitPrice.toLocaleString('cs-CZ') : ''}</td>
                                  <td className="py-1 px-1 text-right tabular-nums">{totalWithout ? totalWithout.toLocaleString('cs-CZ') : ''}</td>
                                  <td className="py-1 px-1 text-right tabular-nums text-muted-foreground">{vatAmount > 0 ? vatAmount.toLocaleString('cs-CZ') : ''}</td>
                                  <td className="py-1 px-1 text-right tabular-nums font-medium">{totalWith.toLocaleString('cs-CZ')}</td>
                                  <td className="py-1 pl-1 text-right text-muted-foreground">{vatRate}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Predkontace section */}
                  {currentDoc && (
                    <div className="pt-1.5 border-t mt-2">
                      <button
                        onClick={() => setShowPredkontace(!showPredkontace)}
                        className="flex items-center gap-1 w-full text-left mb-1"
                      >
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <Label className="text-[11px] text-muted-foreground cursor-pointer">
                          Předkontace
                        </Label>
                        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${showPredkontace ? 'rotate-180' : ''}`} />
                        {journalEntries.length > 0 && (
                          <Badge variant="outline" className="text-[10px] ml-auto">{journalEntries.length}</Badge>
                        )}
                      </button>

                      {showPredkontace && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2"
                              onClick={handleGeneratePredkontace}
                              disabled={loadingPredkontace}
                            >
                              {loadingPredkontace ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <BookOpen className="h-3 w-3 mr-1" />}
                              {journalEntries.length > 0 ? 'Přegenerovat' : 'Navrhnout'}
                            </Button>
                            {journalEntries.length > 0 && journalEntries.some(e => e.status === 'suggested') && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2 text-green-600 border-green-300"
                                onClick={handleApproveAllEntries}
                              >
                                <Check className="h-3 w-3 mr-1" /> Schválit vše
                              </Button>
                            )}
                          </div>

                          {journalEntries.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="border-b text-muted-foreground">
                                    <th className="text-left py-0.5 pr-1">#</th>
                                    <th className="text-left py-0.5 px-1">Popis</th>
                                    <th className="text-left py-0.5 px-1">MD</th>
                                    <th className="text-left py-0.5 px-1">D</th>
                                    <th className="text-right py-0.5 px-1">Částka</th>
                                    <th className="text-center py-0.5 px-1">Status</th>
                                    <th className="text-center py-0.5 pl-1">Akce</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {journalEntries.map(entry => {
                                    const statusDot = {
                                      suggested: 'bg-blue-500',
                                      approved: 'bg-green-500',
                                      modified: 'bg-yellow-500',
                                      rejected: 'bg-red-500',
                                    }[entry.status] || 'bg-gray-400'

                                    return (
                                      <tr key={entry.id || entry.line_number} className="border-b border-muted/50">
                                        <td className="py-0.5 pr-1 text-muted-foreground">{entry.line_number}</td>
                                        <td className="py-0.5 px-1 max-w-[100px] truncate">{entry.description}</td>
                                        <td className="py-0.5 px-1">
                                          <span className="font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded text-[9px]">
                                            {entry.debit_account}
                                          </span>
                                        </td>
                                        <td className="py-0.5 px-1">
                                          <span className="font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded text-[9px]">
                                            {entry.credit_account}
                                          </span>
                                        </td>
                                        <td className="py-0.5 px-1 text-right tabular-nums font-medium whitespace-nowrap">
                                          {entry.amount.toLocaleString('cs-CZ')} Kč
                                        </td>
                                        <td className="py-0.5 px-1 text-center">
                                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot}`} title={entry.status} />
                                        </td>
                                        <td className="py-0.5 pl-1 text-center">
                                          {entry.status === 'suggested' && entry.id && (
                                            <button
                                              onClick={() => handleEntryAction(entry.id, 'approved')}
                                              className="p-0.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                              title="Schválit"
                                            >
                                              <Check className="h-3 w-3" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {!loadingPredkontace && journalEntries.length === 0 && (
                            <p className="text-[10px] text-muted-foreground text-center py-1">
                              Žádné záznamy předkontace
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
