'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, Pencil, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtractedData } from '@/components/extraction'

interface VerifyCardProps {
  extractedData: ExtractedData
  confidenceScore?: number
  onConfirm: (corrections: Record<string, unknown>) => Promise<void>
  onSkip?: () => void
  className?: string
}

interface FieldDef {
  key: string
  label: string
  suffix?: string
  type?: string
}

const fields: FieldDef[] = [
  { key: 'supplier_name', label: 'Dodavatel' },
  { key: 'supplier_ico', label: 'IČO' },
  { key: 'total_amount', label: 'Částka', suffix: 'Kč' },
  { key: 'total_vat', label: 'DPH', suffix: 'Kč' },
  { key: 'date_issued', label: 'Datum', type: 'date' },
  { key: 'variable_symbol', label: 'VS' },
]

export function VerifyCard({ extractedData, confidenceScore, onConfirm, onSkip, className }: VerifyCardProps) {
  const data = extractedData as Record<string, unknown>
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of fields) {
      initial[f.key] = data[f.key] != null ? String(data[f.key]) : ''
    }
    return initial
  })

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const corrections: Record<string, unknown> = {}
      for (const f of fields) {
        const original = data[f.key] != null ? String(data[f.key]) : ''
        if (values[f.key] !== original) {
          corrections[f.key] = f.suffix === 'Kč' ? parseFloat(values[f.key]) || undefined : values[f.key]
        }
      }
      await onConfirm(corrections)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn('bg-muted/30 rounded-xl p-4 border space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">Vytěžená data</h4>
          {confidenceScore != null && (
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              confidenceScore >= 0.8
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : confidenceScore >= 0.5
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            )}>
              {Math.round(confidenceScore * 100)}%
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(!editing)}
          className="h-7 text-xs"
        >
          <Pencil className="w-3 h-3 mr-1" />
          {editing ? 'Hotovo' : 'Opravit'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <span className="text-xs text-muted-foreground">{f.label}</span>
            {editing ? (
              <div className="flex items-center gap-1">
                <Input
                  type={f.type || 'text'}
                  value={values[f.key]}
                  onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-8 text-sm"
                />
                {f.suffix && <span className="text-xs text-muted-foreground shrink-0">{f.suffix}</span>}
              </div>
            ) : (
              <p className="text-sm font-medium">
                {values[f.key] || <span className="text-muted-foreground italic">—</span>}
                {f.suffix && values[f.key] ? ` ${f.suffix}` : ''}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1 h-10 gap-2"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          Potvrdit správnost
        </Button>
        {onSkip && (
          <Button variant="outline" size="sm" onClick={onSkip} className="h-10">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Přeskočit
          </Button>
        )}
      </div>
    </div>
  )
}
