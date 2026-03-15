'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, X, ChevronDown } from 'lucide-react'
import type { DocumentFilters, DocumentType, DocumentStatus } from '@/lib/types/document-register'
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, defaultDocumentFilters } from '@/lib/types/document-register'

interface DocumentRegisterFiltersProps {
  filters: DocumentFilters
  onChange: (filters: DocumentFilters) => void
  availableTypes?: DocumentType[]
}

export function DocumentRegisterFilters({ filters, onChange, availableTypes }: DocumentRegisterFiltersProps) {
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

  const toggleType = (type: DocumentType) => {
    const next = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onChange({ ...filters, types: next })
  }

  const toggleStatus = (status: DocumentStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses: next })
  }

  // Which types to show in the dropdown
  const typeEntries = availableTypes
    ? availableTypes.map(k => [k, DOCUMENT_TYPE_LABELS[k]] as [DocumentType, string])
    : (Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][])

  const statusEntries = Object.entries(DOCUMENT_STATUS_LABELS) as [DocumentStatus, string][]

  const typeButtonLabel = filters.types.length === 0
    ? 'Všechny typy'
    : filters.types.length === 1
      ? DOCUMENT_TYPE_LABELS[filters.types[0]]
      : `${filters.types.length} typy`

  const statusButtonLabel = filters.statuses.length === 0
    ? 'Všechny stavy'
    : filters.statuses.length === 1
      ? DOCUMENT_STATUS_LABELS[filters.statuses[0]]
      : `${filters.statuses.length} stavy`

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
          {/* Multi-select Type filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[180px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm justify-between font-normal"
              >
                <span className="truncate">{typeButtonLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                {typeEntries.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={filters.types.includes(key)}
                      onCheckedChange={() => toggleType(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {filters.types.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs text-gray-500"
                  onClick={() => onChange({ ...filters, types: [] })}
                >
                  Zrušit výběr
                </Button>
              )}
            </PopoverContent>
          </Popover>

          {/* Multi-select Status filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[170px] h-9 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm justify-between font-normal"
              >
                <span className="truncate">{statusButtonLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-50 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                {statusEntries.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={filters.statuses.includes(key)}
                      onCheckedChange={() => toggleStatus(key)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {filters.statuses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs text-gray-500"
                  onClick={() => onChange({ ...filters, statuses: [] })}
                >
                  Zrušit výběr
                </Button>
              )}
            </PopoverContent>
          </Popover>
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
