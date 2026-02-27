'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ExtractedData, ExtractionDocumentType } from './types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ConfidenceBadge } from './ConfidenceBadge'

interface ExtractedDataDisplayProps {
  data: ExtractedData
  documentType: ExtractionDocumentType
  confidenceScore?: number
  editable?: boolean
  onFieldChange?: (field: string, value: string | number) => void
  corrections?: Array<{ field: string; original: unknown; corrected: unknown }>
}

interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency'
  editable?: boolean
}

const getFieldsForType = (type: ExtractionDocumentType): FieldConfig[] => {
  const common: FieldConfig[] = [
    { key: 'document_number', label: 'Číslo dokladu', type: 'text' },
    { key: 'date_issued', label: 'Datum vystavení', type: 'date' },
    { key: 'supplier_name', label: 'Dodavatel', type: 'text' },
  ]

  switch (type) {
    case 'receipt':
      return [
        ...common,
        { key: 'variable_symbol', label: 'Variabilní symbol', type: 'text' },
        { key: 'total_amount', label: 'Celková částka', type: 'currency' },
      ]
    case 'invoice':
    case 'advance_invoice':
    case 'credit_note':
      return [
        ...common,
        { key: 'variable_symbol', label: 'Variabilní symbol', type: 'text' },
        { key: 'constant_symbol', label: 'Konstantní symbol', type: 'text' },
        { key: 'date_due', label: 'Datum splatnosti', type: 'date' },
        { key: 'supplier_ico', label: 'IČO dodavatele', type: 'text' },
        { key: 'total_without_vat', label: 'Bez DPH', type: 'currency' },
        { key: 'total_vat', label: 'DPH', type: 'currency' },
        { key: 'total_amount', label: 'Celkem s DPH', type: 'currency' },
      ]
    case 'bank_statement':
      return [
        { key: 'account_number', label: 'Číslo účtu', type: 'text' },
        { key: 'bank_code', label: 'Kód banky', type: 'text' },
        { key: 'statement_number', label: 'Číslo výpisu', type: 'text' },
        { key: 'period_from', label: 'Období od', type: 'date' },
        { key: 'period_to', label: 'Období do', type: 'date' },
      ]
    case 'contract':
      return [
        { key: 'contract_number', label: 'Číslo smlouvy', type: 'text' },
        { key: 'party_a', label: 'Strana A', type: 'text' },
        { key: 'party_b', label: 'Strana B', type: 'text' },
        { key: 'valid_from', label: 'Platnost od', type: 'date' },
        { key: 'valid_to', label: 'Platnost do', type: 'date' },
      ]
    default:
      return common
  }
}

export function ExtractedDataDisplay({
  data,
  documentType,
  confidenceScore,
  editable = false,
  onFieldChange,
  corrections = []
}: ExtractedDataDisplayProps) {
  const fields = getFieldsForType(documentType)
  const correctionMap = new Map(corrections.map(c => [c.field, c]))

  const getValue = (key: string): string => {
    const value = (data as unknown as Record<string, unknown>)?.[key]
    if (value === null || value === undefined) return ''
    return String(value)
  }

  const formatDisplayValue = (field: FieldConfig, value: string): string => {
    if (!value) return ''
    switch (field.type) {
      case 'currency':
        return formatCurrency(parseFloat(value) || 0)
      case 'date':
        return formatDate(value)
      default:
        return value
    }
  }

  const isCorrected = (key: string) => correctionMap.has(key)
  const getOriginalValue = (key: string) => correctionMap.get(key)?.original

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Vytěžená data</h3>
          {confidenceScore !== undefined && (
            <ConfidenceBadge score={Math.round(confidenceScore)} size="sm" />
          )}
        </div>

        <div className="grid gap-4">
          {fields.map((field) => {
            const value = getValue(field.key)
            const corrected = isCorrected(field.key)
            const originalValue = corrected ? getOriginalValue(field.key) : null

            return (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  {field.label}
                  {corrected && (
                    <span className="text-amber-600 text-xs">
                      (opraveno z: {String(originalValue)})
                    </span>
                  )}
                </Label>
                {editable ? (
                  <Input
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => onFieldChange?.(field.key, e.target.value)}
                    className={corrected ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : ''}
                  />
                ) : (
                  <div className={`
                    px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 text-sm
                    ${corrected ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200' : 'text-gray-900 dark:text-gray-100'}
                  `}>
                    {formatDisplayValue(field, value) ||
                      <span className="text-gray-400 dark:text-gray-500 italic">Neuvedeno</span>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
