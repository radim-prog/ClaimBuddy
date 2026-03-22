'use client'

import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Landmark,
  Receipt,
  Download,
  Eye,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfidenceBadge } from '@/components/extraction'

export interface DocumentRowData {
  id: string
  company_id: string
  period: string
  type: string
  file_name: string
  file_size_bytes: number
  status: string
  ocr_status?: string | null
  uploaded_at: string
  storage_path: string | null
  supplier_name?: string | null
  total_with_vat?: number | null
  confidence_score?: number | null
  date_issued?: string | null
  document_number?: string | null
  variable_symbol?: string | null
}

const typeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  bank_statement: { label: 'Výpis', icon: Landmark },
  expense_invoice: { label: 'Přijatá faktura', icon: Receipt },
  income_invoice: { label: 'Vydaná faktura', icon: FileText },
  invoice: { label: 'Faktura', icon: Receipt },
  receipt: { label: 'Účtenka', icon: Receipt },
  advance_invoice: { label: 'Záloha', icon: Receipt },
  credit_note: { label: 'Dobropis', icon: Receipt },
  cash_receipt: { label: 'Pokladní', icon: Receipt },
  other: { label: 'Ostatní', icon: FileText },
}

const statusColors: Record<string, string> = {
  uploaded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  extracted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  client_verified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  booked: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const statusLabels: Record<string, string> = {
  uploaded: 'Nahráno',
  uploaded_only: 'Čeká',
  extracting: 'Vytěžování...',
  extracted: 'Vytěženo',
  client_verified: 'Ověřeno',
  approved: 'Schváleno',
  rejected: 'Zamítnuto',
  draft: 'Nepotvrzeno',
  submitted: 'Odesláno',
  booked: 'Zaúčtováno',
}

function formatSize(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentRowProps {
  doc: DocumentRowData
  selected?: boolean
  onClick?: () => void
  expanded?: boolean
  children?: React.ReactNode
}

export function DocumentRow({ doc, selected, onClick, expanded, children }: DocumentRowProps) {
  const typeInfo = typeConfig[doc.type] || { label: doc.type, icon: FileText }
  const Icon = typeInfo.icon
  const docStatus = doc.ocr_status || doc.status
  const displayName = doc.supplier_name || doc.file_name

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-colors cursor-pointer',
        selected ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50',
        docStatus === 'draft' && 'border-amber-300 dark:border-amber-700'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 py-2.5 px-3">
        {/* Type icon */}
        <div className="p-1.5 bg-muted rounded-lg shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{typeInfo.label}</span>
            {doc.date_issued && (
              <><span>·</span><span>{new Date(doc.date_issued).toLocaleDateString('cs-CZ')}</span></>
            )}
            {!doc.date_issued && doc.period && (
              <><span>·</span><span>{doc.period}</span></>
            )}
            {doc.document_number && (
              <><span>·</span><span className="font-mono">{doc.document_number}</span></>
            )}
            {doc.file_size_bytes > 0 && !doc.supplier_name && (
              <><span>·</span><span>{formatSize(doc.file_size_bytes)}</span></>
            )}
          </div>
        </div>

        {/* Right side: amount, confidence, status, actions */}
        <div className="flex items-center gap-2 shrink-0">
          {doc.total_with_vat != null && doc.total_with_vat > 0 && (
            <span className="text-sm font-semibold text-foreground hidden sm:inline">
              {doc.total_with_vat.toLocaleString('cs-CZ')} Kč
            </span>
          )}

          {doc.confidence_score != null && doc.confidence_score > 0 && (
            <span className="hidden md:inline">
              <ConfidenceBadge score={doc.confidence_score} showLabel={false} size="sm" />
            </span>
          )}

          {doc.storage_path && (
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => window.open(`/api/documents/${doc.id}/download?inline=true`, '_blank')}
                className="p-1 text-muted-foreground hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Náhled"
              >
                <Eye className="h-3.5 w-3.5" />
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
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <Badge className={cn('rounded-md text-[11px]', statusColors[docStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300')}>
            {statusLabels[docStatus] || docStatus}
          </Badge>

          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {/* Expanded content — extraction data */}
      {expanded && children && (
        <div className="px-3 pb-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
          <div className="pt-3">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
