'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  X, Download, Trash2, ShieldCheck, Loader2, Eye, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ExtractedDataDisplay,
  ConfidenceBadge,
  type ExtractedData,
  type ExtractionDocumentType,
} from '@/components/extraction'
import { ExtractionStatusBadge } from './extraction-status-badge'
import { type DocumentRowData } from './document-row'
import { toast } from 'sonner'

interface DocumentDetailSheetProps {
  doc: DocumentRowData
  open: boolean
  onClose: () => void
  onVerified?: () => void
  onDeleted?: () => void
}

export function DocumentDetailSheet({ doc, open, onClose, onVerified, onDeleted }: DocumentDetailSheetProps) {
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [corrections, setCorrections] = useState<Record<string, unknown>>({})
  const [notes, setNotes] = useState('')

  const handleFieldChange = (field: string, value: string | number) => {
    setCorrections(prev => ({ ...prev, [field]: value }))
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await fetch(`/api/client/documents/${doc.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: true,
          corrections: Object.keys(corrections).length > 0 ? corrections : undefined,
        }),
      })
      if (res.ok) {
        toast.success('Doklad ověřen')
        onVerified?.()
        onClose()
      } else {
        toast.error('Ověření selhalo')
      }
    } catch {
      toast.error('Ověření selhalo')
    } finally {
      setVerifying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Opravdu chcete smazat tento doklad?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/client/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Doklad smazán')
        onDeleted?.()
        onClose()
      } else {
        toast.error('Smazání selhalo')
      }
    } catch {
      toast.error('Smazání selhalo')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async () => {
    const res = await fetch(`/api/documents/${doc.id}/download`)
    if (res.ok) {
      const data = await res.json()
      const a = document.createElement('a')
      a.href = data.url
      a.download = data.file_name || doc.file_name
      a.click()
    }
  }

  // Derive document type for ExtractedDataDisplay
  const extractionDocType: ExtractionDocumentType =
    doc.type === 'receipt' ? 'receipt' :
    doc.type === 'bank_statement' ? 'bank_statement' :
    doc.type === 'credit_note' ? 'credit_note' :
    doc.type === 'advance_invoice' ? 'advance_invoice' :
    'invoice'

  // Build pseudo-extracted data from API fields
  const extractedData: ExtractedData | null = (doc.supplier_name || doc.total_with_vat || doc.document_number) ? {
    document_type: extractionDocType as 'invoice',
    supplier_name: doc.supplier_name || undefined,
    total_amount: doc.total_with_vat || undefined,
    document_number: doc.document_number || undefined,
    variable_symbol: doc.variable_symbol || undefined,
    date_issued: doc.date_issued || undefined,
  } : null

  const canVerify = doc.ocr_status !== 'client_verified' && doc.ocr_status !== 'approved' && doc.ocr_status !== 'booked'
  const isImage = doc.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  return (
    <div
      className={cn(
        'fixed inset-0 z-[55]',
        'bg-black/50 backdrop-blur-sm',
        'flex justify-end',
        'transition-all duration-300 ease-out',
        open ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={cn(
        'w-full sm:max-w-md bg-background h-full overflow-y-auto',
        'transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold font-display truncate">{doc.supplier_name || doc.file_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <ExtractionStatusBadge status={doc.ocr_status || doc.status} />
              {doc.confidence_score != null && doc.confidence_score > 0 && (
                <ConfidenceBadge score={doc.confidence_score} showLabel={false} size="sm" />
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Preview */}
          {doc.storage_path && (
            <div className="rounded-xl border bg-muted overflow-hidden">
              {isImage ? (
                <img
                  src={`/api/documents/${doc.id}/download?inline=true`}
                  alt={doc.file_name}
                  className="w-full max-h-64 object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Otevřít náhled
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Extraction data */}
          {extractedData && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Vytěžená data</h3>
              <ExtractedDataDisplay
                data={extractedData}
                documentType={extractionDocType}
                confidenceScore={doc.confidence_score || undefined}
                editable={canVerify}
                onFieldChange={handleFieldChange}
                corrections={Object.entries(corrections).map(([field, corrected]) => ({
                  field,
                  original: (extractedData as Record<string, unknown>)[field],
                  corrected,
                }))}
              />
            </div>
          )}

          {/* No extraction data */}
          {!extractedData && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Žádná vytěžená data
            </div>
          )}

          {/* Notes for verify */}
          {canVerify && (
            <div>
              <Label className="text-sm">Poznámka</Label>
              <Textarea
                placeholder="Poznámka pro účetní..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {canVerify && (
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <ShieldCheck className="w-4 h-4 mr-1.5" />}
                Potvrdit správnost
              </Button>
            )}

            <div className="flex gap-2">
              {doc.storage_path && (
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Stáhnout
                </Button>
              )}
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
