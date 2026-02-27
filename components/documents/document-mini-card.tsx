'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Landmark, Receipt, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DocumentLinkType } from '@/lib/types/document-links'
import { LINK_TYPE_LABELS, LINK_TYPE_COLORS } from '@/lib/types/document-links'

interface DocumentInfo {
  id: string
  file_name: string
  type: string
  status: string
  supplier_name: string | null
  total_with_vat: number | null
  date_issued: string | null
  period: string
  accounting_number: string | null
}

interface DocumentMiniCardProps {
  document: DocumentInfo
  linkType?: DocumentLinkType
  showUnlink?: boolean
  onUnlink?: () => void
}

const typeIcons: Record<string, typeof FileText> = {
  bank_statement: Landmark,
  expense_invoice: Receipt,
  income_invoice: FileText,
}

export function DocumentMiniCard({ document: doc, linkType, showUnlink, onUnlink }: DocumentMiniCardProps) {
  const Icon = typeIcons[doc.type] || FileText
  const ltColors = linkType ? LINK_TYPE_COLORS[linkType] : null

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 group">
      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {doc.accounting_number && (
            <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{doc.accounting_number}</span>
          )}
          <span className="text-sm text-gray-900 dark:text-white truncate">{doc.file_name}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          {doc.supplier_name && <span className="truncate max-w-[120px]">{doc.supplier_name}</span>}
          {doc.total_with_vat !== null && (
            <>
              {doc.supplier_name && <span>·</span>}
              <span className="font-medium">{formatCurrency(doc.total_with_vat)}</span>
            </>
          )}
          {doc.date_issued && (
            <>
              <span>·</span>
              <span>{new Date(doc.date_issued).toLocaleDateString('cs-CZ')}</span>
            </>
          )}
        </div>
      </div>
      {linkType && ltColors && (
        <Badge className={`${ltColors.bg} ${ltColors.text} text-[10px] shrink-0`}>
          {LINK_TYPE_LABELS[linkType]}
        </Badge>
      )}
      {showUnlink && onUnlink && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => { e.stopPropagation(); onUnlink() }}
        >
          <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
        </Button>
      )}
    </div>
  )
}
