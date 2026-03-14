'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
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

type FieldDef = {
  key: string
  label: string
  path: string[] // JSON path to access nested fields
  type: 'text' | 'date' | 'number'
  required?: boolean
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
  { key: 'supplier_address', label: 'Adresa', path: ['supplier', 'address'], type: 'text' },
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

export default function VerificationPage() {
  const { userId } = useAccountantUser()
  const [documents, setDocuments] = useState<VerifyDocument[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editedData, setEditedData] = useState<any>(null)
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [approving, setApproving] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)

  const currentDoc = documents[currentIndex]

  const fetchDocuments = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/extraction/verify', {
        headers: { 'x-user-id': userId },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        if (data.documents?.length > 0) {
          setEditedData(data.documents[0].ocr_data)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    if (!currentDoc) return
    setEditedData(currentDoc.ocr_data)
    setHighlightedField(null)

    // Get file URL for viewer
    fetch(`/api/documents/${currentDoc.id}/download`, {
      headers: { 'x-user-id': userId || '' },
    })
      .then(r => r.json())
      .then(data => setFileUrl(data.url || null))
      .catch(() => setFileUrl(null))
  }, [currentDoc, userId])

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
        // Remove from list and move to next
        const newDocs = documents.filter((_, i) => i !== currentIndex)
        setDocuments(newDocs)
        if (currentIndex >= newDocs.length) setCurrentIndex(Math.max(0, newDocs.length - 1))
      } else {
        toast.error('Chyba při schvalování')
      }
    } catch {
      toast.error('Chyba připojení')
    } finally {
      setApproving(false)
    }
  }

  const handleApproveAll = async () => {
    if (!confirm(`Schválit všech ${documents.length} dokladů?`)) return
    for (let i = 0; i < documents.length; i++) {
      try {
        await fetch(`/api/extraction/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || '',
          },
          body: JSON.stringify({
            documentId: documents[i].id,
            editedData: documents[i].ocr_data,
            action: 'approve',
          }),
        })
      } catch {
        // continue
      }
    }
    toast.success(`${documents.length} dokladů schváleno`)
    setDocuments([])
    setCurrentIndex(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
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

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between py-2 border-b mb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDoc('prev')}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentIndex + 1} / {documents.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDoc('next')}
            disabled={currentIndex === documents.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentDoc?.company_name} — {currentDoc?.file_name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {editedData?.confidence_score && (
            <ConfidenceBadge score={Math.round(editedData.confidence_score)} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleApproveAll}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Schválit vše ({documents.length})
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {approving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Schválit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              toast.info('Doklad označen jako problém')
              const newDocs = documents.filter((_, i) => i !== currentIndex)
              setDocuments(newDocs)
              if (currentIndex >= newDocs.length) setCurrentIndex(Math.max(0, newDocs.length - 1))
            }}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Problém
          </Button>
        </div>
      </div>

      {/* Split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* LEFT: Document viewer */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground">Dokument</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(50, z - 25))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 25))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
                <RotateCw className="h-3.5 w-3.5" />
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
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Vytěžená data</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Jisté
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Nejisté
              <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Manuální
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
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
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-0.5">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type={field.type === 'date' ? 'date' : 'text'}
                      value={value ?? ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={`h-8 text-sm ${confidenceFieldClasses[conf]}`}
                    />
                  </div>
                )
              })}

              {/* Items section */}
              {editedData?.items?.length > 0 && (
                <div className="pt-2 border-t mt-3">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Položky ({editedData.items.length})
                  </Label>
                  <div className="space-y-1.5">
                    {editedData.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
                        <span className="flex-1 truncate">{item.description || '-'}</span>
                        <span className="text-muted-foreground">{item.quantity}x</span>
                        <span className="font-medium whitespace-nowrap">
                          {Number(item.total_price || 0).toLocaleString('cs-CZ')} Kč
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.vat_rate === 'none' ? '0%' : item.vat_rate === 'low' ? '12%' : '21%'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
