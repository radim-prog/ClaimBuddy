'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import type { DocumentFilters, DocumentType, DocumentStatus } from '@/lib/types/document-register'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, defaultDocumentFilters } from '@/lib/types/document-register'

interface DocumentRegisterFiltersProps {
  filters: DocumentFilters
  onChange: (filters: DocumentFilters) => void
}

export function DocumentRegisterFilters({ filters, onChange }: DocumentRegisterFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = [
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.dateFrom !== null,
    filters.dateTo !== null,
    filters.amountMin !== null,
    filters.amountMax !== null,
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearchInput('')
    onChange(defaultDocumentFilters)
  }

  const setType = (value: string) => {
    if (value === 'none') {
      onChange({ ...filters, types: [] })
    } else {
      onChange({ ...filters, types: [value as DocumentType] })
    }
  }

  const setStatus = (value: string) => {
    if (value === 'none') {
      onChange({ ...filters, statuses: [] })
    } else {
      onChange({ ...filters, statuses: [value as DocumentStatus] })
    }
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat doklad, dodavatele, VS, IČO..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 h-10 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); onChange({ ...filters, search: '' }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-red-500 rounded-xl transition-colors">
            <X className="h-4 w-4 mr-1" />
            Vymazat ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Filter row - grouped */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* Dropdowns group */}
        <div className="flex items-center gap-2">
          <Select value={filters.types[0] || 'none'} onValueChange={setType}>
            <SelectTrigger className="w-[160px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
              <SelectValue placeholder="Všechny typy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Všechny typy</SelectItem>
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.statuses[0] || 'none'} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
              <SelectValue placeholder="Všechny stavy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Všechny stavy</SelectItem>
              {(Object.entries(DOCUMENT_STATUS_LABELS) as [DocumentStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-7 bg-gray-200 dark:bg-gray-700" />

        {/* Date range group */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
            className="w-[140px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
          />
          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
            className="w-[140px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-7 bg-gray-200 dark:bg-gray-700" />

        {/* Amount range group */}
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={filters.amountMin ?? ''}
            onChange={(e) => onChange({ ...filters, amountMin: e.target.value ? Number(e.target.value) : null })}
            className="w-[110px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
            placeholder="Kč od"
          />
          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
          <Input
            type="number"
            value={filters.amountMax ?? ''}
            onChange={(e) => onChange({ ...filters, amountMax: e.target.value ? Number(e.target.value) : null })}
            className="w-[110px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
            placeholder="Kč do"
          />
        </div>
      </div>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.types.map(t => (
            <Badge key={t} variant="secondary" className="text-xs gap-1 rounded-full px-2.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-0">
              {DOCUMENT_TYPE_LABELS[t]}
              <button onClick={() => onChange({ ...filters, types: filters.types.filter(x => x !== t) })} className="hover:text-purple-900 dark:hover:text-purple-100">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.statuses.map(s => (
            <Badge key={s} variant="secondary" className="text-xs gap-1 rounded-full px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-0">
              {DOCUMENT_STATUS_LABELS[s]}
              <button onClick={() => onChange({ ...filters, statuses: filters.statuses.filter(x => x !== s) })} className="hover:text-blue-900 dark:hover:text-blue-100">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
