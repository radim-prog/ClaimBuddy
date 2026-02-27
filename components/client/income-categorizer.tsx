'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const categories = [
  { value: 'invoice_income', label: 'Příjem z faktury', description: 'Úhrada vydané faktury' },
  { value: 'other_taxable', label: 'Jiný zdanitelný příjem', description: 'Zdanitelný příjem bez faktury' },
  { value: 'private_transfer', label: 'Soukromý převod', description: 'Nezdanitelný (např. mezi vlastními účty)' },
  { value: 'owner_deposit', label: 'Vklad podnikatele', description: 'Vklad vlastních prostředků do podnikání' },
  { value: 'uncategorized', label: 'Nezařazeno', description: 'Zatím nekategorizováno' },
] as const

interface IncomeCategorizerProps {
  value: string
  onChange: (category: string) => void
  compact?: boolean
}

export function IncomeCategorizer({ value, onChange, compact }: IncomeCategorizerProps) {
  if (compact) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-background"
      >
        {categories.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    )
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Zvolte kategorii" />
      </SelectTrigger>
      <SelectContent>
        {categories.map(c => (
          <SelectItem key={c.value} value={c.value}>
            <div>
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.description}</p>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
