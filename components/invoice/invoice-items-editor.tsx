'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, ListPlus } from 'lucide-react'
import { formatCurrencyDetailed as formatCurrency } from '@/lib/utils'

export interface InvoiceItemRow {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
}

interface InvoiceItemsEditorProps {
  items: InvoiceItemRow[]
  onChange: (items: InvoiceItemRow[]) => void
  defaultVatRate?: number
  onOpenTemplates?: () => void
}

function calcRow(item: InvoiceItemRow) {
  const base = item.quantity * item.unit_price
  const vat = base * (item.vat_rate / 100)
  return { base: Math.round(base * 100) / 100, vat: Math.round(vat * 100) / 100, total: Math.round((base + vat) * 100) / 100 }
}


export function InvoiceItemsEditor({ items, onChange, defaultVatRate = 21, onOpenTemplates }: InvoiceItemsEditorProps) {
  const addRow = () => {
    onChange([...items, {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit: 'ks',
      unit_price: 0,
      vat_rate: defaultVatRate,
    }])
  }

  const updateRow = (idx: number, key: keyof InvoiceItemRow, value: string | number) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [key]: value } : item)
    onChange(updated)
  }

  const removeRow = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  // Totals
  const totals = items.reduce(
    (acc, item) => {
      const { base, vat, total } = calcRow(item)
      return { base: acc.base + base, vat: acc.vat + vat, total: acc.total + total }
    },
    { base: 0, vat: 0, total: 0 }
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Polozky faktury</CardTitle>
          <div className="flex gap-2">
            {onOpenTemplates && (
              <Button type="button" size="sm" variant="outline" onClick={onOpenTemplates}>
                <ListPlus className="h-4 w-4 mr-1" />
                Z ceniku
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4 mr-1" />
              Pridat radek
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-purple-200 dark:border-purple-800">
                <th className="text-left py-2 px-1 text-xs font-semibold text-gray-500 w-[35%]">Popis</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-gray-500 w-[8%]">Mn.</th>
                <th className="text-center py-2 px-1 text-xs font-semibold text-gray-500 w-[8%]">Jed.</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-gray-500 w-[14%]">Cena/jed.</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-gray-500 w-[8%]">DPH%</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-gray-500 w-[14%]">Zaklad</th>
                <th className="text-right py-2 px-1 text-xs font-semibold text-gray-500 w-[14%]">Celkem</th>
                <th className="py-2 px-1 w-[5%]"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const { base, total } = calcRow(item)
                return (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1 px-1">
                      <Input
                        value={item.description}
                        onChange={e => updateRow(idx, 'description', e.target.value)}
                        placeholder="Popis polozky"
                        className="h-8 text-sm"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateRow(idx, 'quantity', Number(e.target.value))}
                        className="h-8 text-sm text-right"
                        min={0}
                        step={0.5}
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        value={item.unit}
                        onChange={e => updateRow(idx, 'unit', e.target.value)}
                        className="h-8 text-sm text-center"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updateRow(idx, 'unit_price', Number(e.target.value))}
                        className="h-8 text-sm text-right"
                        min={0}
                        step={1}
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        value={item.vat_rate}
                        onChange={e => updateRow(idx, 'vat_rate', Number(e.target.value))}
                        className="h-8 text-sm text-right"
                        min={0}
                        max={100}
                      />
                    </td>
                    <td className="py-1 px-1 text-right text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {formatCurrency(base)}
                    </td>
                    <td className="py-1 px-1 text-right text-sm font-semibold font-mono">
                      {formatCurrency(total)}
                    </td>
                    <td className="py-1 px-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeRow(idx)} className="h-8 w-8 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              Zadne polozky. Kliknete na &quot;Pridat radek&quot; nebo &quot;Z ceniku&quot;.
            </div>
          )}
        </div>

        {/* Totals */}
        {items.length > 0 && (
          <div className="mt-4 ml-auto max-w-xs space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Zaklad</span>
              <span className="font-mono font-medium">{formatCurrency(totals.base)} Kc</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">DPH</span>
              <span className="font-mono font-medium">{formatCurrency(totals.vat)} Kc</span>
            </div>
            <div className="flex justify-between text-base pt-2 mt-2 border-t-2 border-purple-300 dark:border-purple-700">
              <span className="font-bold">CELKEM</span>
              <span className="font-bold font-mono text-purple-600 dark:text-purple-400">{formatCurrency(totals.total)} Kc</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Export helper for totals calculation
export function calculateItemTotals(items: InvoiceItemRow[]) {
  return items.reduce(
    (acc, item) => {
      const { base, vat, total } = calcRow(item)
      return { base: acc.base + base, vat: acc.vat + vat, total: acc.total + total }
    },
    { base: 0, vat: 0, total: 0 }
  )
}
