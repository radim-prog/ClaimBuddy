'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import type { InvoiceItemTemplate } from '@/lib/types/invoice-settings'
import type { InvoiceItemRow } from './invoice-items-editor'

interface TemplatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (item: InvoiceItemRow) => void
}

export function TemplatePickerDialog({ open, onOpenChange, onSelect }: TemplatePickerDialogProps) {
  const [templates, setTemplates] = useState<InvoiceItemTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/accountant/invoice-templates')
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.templates) setTemplates(json.templates) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const filtered = search
    ? templates.filter(t =>
        normalize(t.name).includes(normalize(search)) ||
        normalize(t.description || '').includes(normalize(search))
      )
    : templates

  const handleSelect = (t: InvoiceItemTemplate) => {
    onSelect({
      id: `item-${Date.now()}`,
      description: t.description || t.name,
      quantity: 1,
      unit: t.unit,
      unit_price: Number(t.unit_price),
      vat_rate: Number(t.vat_rate),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vybrat z ceniku</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Hledat polozku..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading && <p className="text-sm text-center text-gray-500 py-4">Nacitam...</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center text-gray-500 py-4">
              {templates.length === 0 ? 'Cenik je prazdny. Pridejte polozky v Nastaveni > Fakturace.' : 'Zadne vysledky.'}
            </p>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group"
              onClick={() => handleSelect(t)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.name}</p>
                {t.description && <p className="text-xs text-gray-500 truncate">{t.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-semibold">
                  {Number(t.unit_price).toLocaleString('cs-CZ')} Kc/{t.unit}
                </p>
                <p className="text-[10px] text-gray-400">DPH {t.vat_rate}%</p>
              </div>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
