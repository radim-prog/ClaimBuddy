'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  X,
  Check,
  FileText,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { LinkEntityType, DocumentLinkType } from '@/lib/types/document-links'
import { LINK_TYPE_LABELS } from '@/lib/types/document-links'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types/document-register'

interface SearchDocument {
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

interface DocumentLinkPickerProps {
  companyId: string
  entityType: LinkEntityType
  entityId: string
  existingDocIds?: string[]
  onLink: (documentIds: string[], linkType: DocumentLinkType) => void
  onClose: () => void
}

export function DocumentLinkPicker({ companyId, existingDocIds = [], onLink, onClose }: DocumentLinkPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [linkType, setLinkType] = useState<DocumentLinkType>('reference')

  const searchDocs = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ per_page: '20' })
      if (q) params.set('q', q)
      const res = await fetch(`/api/accountant/companies/${companyId}/documents/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults((data.documents || []).filter((d: SearchDocument) => !existingDocIds.includes(d.id)))
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [companyId, existingDocIds])

  useEffect(() => {
    const timer = setTimeout(() => searchDocs(query), 300)
    return () => clearTimeout(timer)
  }, [query, searchDocs])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleLink = () => {
    if (selected.size === 0) return
    onLink(Array.from(selected), linkType)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Připojit doklady</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Hledat doklad, dodavatele, VS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {query ? 'Žádné výsledky' : 'Začněte psát pro vyhledání dokladů'}
            </div>
          )}

          {results.map(doc => {
            const isSelected = selected.has(doc.id)
            return (
              <button
                key={doc.id}
                onClick={() => toggleSelect(doc.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                }`}
              >
                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isSelected && <Check className="h-3 w-3" />}
                </div>

                <FileText className="h-4 w-4 text-gray-400 shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {doc.accounting_number && (
                      <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">{doc.accounting_number}</span>
                    )}
                    <span className="text-sm truncate text-gray-900 dark:text-white">{doc.file_name}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {DOCUMENT_TYPE_LABELS[doc.type as keyof typeof DOCUMENT_TYPE_LABELS] || doc.type}
                    {doc.supplier_name && ` · ${doc.supplier_name}`}
                    {` · ${doc.period}`}
                  </div>
                </div>

                {doc.total_with_vat !== null && (
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">
                    {formatCurrency(doc.total_with_vat)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Typ propojení:</span>
            <div className="flex gap-1">
              {(['reference', 'primary', 'supporting', 'output'] as DocumentLinkType[]).map(lt => (
                <button
                  key={lt}
                  onClick={() => setLinkType(lt)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    linkType === lt
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {LINK_TYPE_LABELS[lt]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Zrušit</Button>
            <Button size="sm" onClick={handleLink} disabled={selected.size === 0}>
              Připojit ({selected.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
