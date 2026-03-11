'use client'

import { ExtractionDocumentType } from './types'
import { Receipt, FileText, FolderOpen, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentTypeSelectorProps {
  value: ExtractionDocumentType
  onChange: (value: ExtractionDocumentType) => void
  disabled?: boolean
  showAll?: boolean
  /** Tile card mode (large clickable cards) — default for scan overlay */
  tileMode?: boolean
}

const tileTypes: {
  value: ExtractionDocumentType
  label: string
  icon: typeof Receipt
}[] = [
  { value: 'receipt', label: 'Účtenka', icon: Receipt },
  { value: 'invoice', label: 'Faktura', icon: FileText },
  { value: 'other', label: 'Ostatní', icon: FolderOpen },
]

const allDocumentTypes: {
  value: ExtractionDocumentType
  label: string
}[] = [
  { value: 'receipt', label: 'Účtenka' },
  { value: 'invoice', label: 'Faktura' },
  { value: 'advance_invoice', label: 'Zálohová faktura' },
  { value: 'credit_note', label: 'Dobropis' },
  { value: 'bank_statement', label: 'Výpis z účtu' },
  { value: 'contract', label: 'Smlouva' },
  { value: 'other', label: 'Ostatní' },
]

const nativeSelectClass = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'

export function DocumentTypeSelector({
  value,
  onChange,
  disabled = false,
  showAll = false,
  tileMode = false,
}: DocumentTypeSelectorProps) {
  // Tile card mode — 3 large clickable cards
  if (tileMode) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {tileTypes.map((type) => {
          const Icon = type.icon
          const isSelected = value === type.value
          return (
            <button
              key={type.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(type.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 transition-all',
                'hover:bg-muted/50 hover:border-blue-300 active:scale-[0.97]',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                  : 'border-muted bg-background',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <Icon className={cn(
                'h-8 w-8',
                isSelected ? 'text-blue-600' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'text-sm font-medium',
                isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'
              )}>
                {type.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown mode (legacy, for other contexts)
  const types = showAll
    ? allDocumentTypes
    : allDocumentTypes.filter(t => ['receipt', 'invoice'].includes(t.value))

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as ExtractionDocumentType)}
      disabled={disabled}
      className={nativeSelectClass}
    >
      {types.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  )
}
