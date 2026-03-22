'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Camera,
  FileText,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DocumentComments } from '@/components/documents/document-comments'
import { DocumentRow, type DocumentRowData } from './document-row'
import { useUrlFilters } from '@/lib/hooks/use-url-filters'

type TypeFilter = 'all' | 'expense_invoice' | 'receipt' | 'bank_statement' | 'income_invoice'
type StatusFilter = 'all' | 'extracted' | 'uploaded' | 'client_verified' | 'error' | 'approved'

const typeOptions: Array<{ key: TypeFilter; label: string }> = [
  { key: 'all', label: 'Vše' },
  { key: 'expense_invoice', label: 'Faktury' },
  { key: 'receipt', label: 'Účtenky' },
  { key: 'income_invoice', label: 'Vydané' },
  { key: 'bank_statement', label: 'Výpisy' },
]

const statusOptions: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'Vše' },
  { key: 'extracted', label: 'Vytěženo' },
  { key: 'uploaded', label: 'Čeká' },
  { key: 'client_verified', label: 'Ověřeno' },
  { key: 'approved', label: 'Schváleno' },
  { key: 'error', label: 'Chyba' },
]

interface DocumentsTabProps {
  onScan: () => void
  onDocumentClick?: (doc: DocumentRowData) => void
}

export function DocumentsTab({ onScan, onDocumentClick }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<DocumentRowData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const { filters, setFilter } = useUrlFilters({ docType: 'all', docStatus: 'all' })
  const typeFilter = filters.docType as TypeFilter
  const statusFilter = filters.docStatus as StatusFilter

  const fetchDocs = useCallback(async () => {
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
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const filtered = documents.filter(doc => {
    // Type filter
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false
    // Status filter
    if (statusFilter !== 'all') {
      const docStatus = doc.ocr_status || doc.status
      if (docStatus !== statusFilter) return false
    }
    return true
  })

  // Count badges
  const extractedCount = documents.filter(d => (d.ocr_status || d.status) === 'extracted').length
  const waitingCount = documents.filter(d => (d.ocr_status || d.status) === 'uploaded').length

  const handleRowClick = (doc: DocumentRowData) => {
    if (onDocumentClick) {
      onDocumentClick(doc)
    } else {
      setSelectedDocId(selectedDocId === doc.id ? null : doc.id)
    }
  }

  return (
    <div className="space-y-3">
      {/* Type filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {typeOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter('docType', opt.key)}
            className={cn(
              'filter-pill',
              typeFilter === opt.key ? 'filter-pill-active' : 'filter-pill-inactive'
            )}
          >
            {opt.label}
          </button>
        ))}
        <span className="text-muted-foreground text-xs mx-1">|</span>
        {statusOptions.map(opt => {
          const count = opt.key === 'extracted' ? extractedCount : opt.key === 'uploaded' ? waitingCount : 0
          return (
            <button
              key={opt.key}
              onClick={() => setFilter('docStatus', opt.key)}
              className={cn(
                'filter-pill',
                statusFilter === opt.key ? 'filter-pill-active' : 'filter-pill-inactive'
              )}
            >
              {opt.label}{count > 0 ? ` (${count})` : ''}
            </button>
          )
        })}
        <Button variant="outline" size="sm" onClick={fetchDocs} className="ml-auto h-7 w-7 p-0">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Loading */}
      {loading && documents.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && documents.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Zatím nemáte žádné dokumenty</p>
            <p className="text-sm text-muted-foreground mb-5">Nahrajte svůj první doklad — fotkou, scanem nebo PDF.</p>
            <Button onClick={onScan} size="sm">
              <Camera className="mr-1.5 h-4 w-4" />
              Nahrát první doklad
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document list */}
      {filtered.length > 0 && (
        <div className="space-y-1.5">
          {filtered.map(doc => {
            const isSelected = selectedDocId === doc.id

            return (
              <DocumentRow
                key={doc.id}
                doc={doc}
                selected={isSelected}
                expanded={isSelected && !onDocumentClick}
                onClick={() => handleRowClick(doc)}
              >
                {/* Expanded: extraction data + comments */}
                <div className="space-y-3">
                  {(doc.supplier_name || doc.total_with_vat || doc.variable_symbol) && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {doc.supplier_name && (
                        <div>
                          <span className="text-xs text-muted-foreground">Dodavatel</span>
                          <p className="font-medium">{doc.supplier_name}</p>
                        </div>
                      )}
                      {doc.total_with_vat != null && doc.total_with_vat > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Částka</span>
                          <p className="font-medium">{doc.total_with_vat.toLocaleString('cs-CZ')} Kč</p>
                        </div>
                      )}
                      {doc.variable_symbol && (
                        <div>
                          <span className="text-xs text-muted-foreground">VS</span>
                          <p className="font-medium font-mono">{doc.variable_symbol}</p>
                        </div>
                      )}
                      {doc.date_issued && (
                        <div>
                          <span className="text-xs text-muted-foreground">Datum vystavení</span>
                          <p className="font-medium">{new Date(doc.date_issued).toLocaleDateString('cs-CZ')}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <DocumentComments documentId={doc.id} userRole="client" />
                </div>
              </DocumentRow>
            )
          })}
        </div>
      )}

      {/* No results for filter */}
      {filtered.length === 0 && documents.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Žádné doklady neodpovídají filtru
        </div>
      )}
    </div>
  )
}
