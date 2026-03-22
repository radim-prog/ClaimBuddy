'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Building2, Search, Check } from 'lucide-react'

type Company = {
  id: string
  name: string
  ico: string
  status: string
}

interface CompanyPickerModalProps {
  open: boolean
  companies: Company[]
  onSelect: (companyId: string) => void
  onSetDefault: (companyId: string) => void
}

const statusDot: Record<string, string> = {
  active: 'bg-green-500',
  pending_review: 'bg-yellow-500',
  onboarding: 'bg-blue-500',
}

export function CompanyPickerModal({ open, companies, onSelect, onSetDefault }: CompanyPickerModalProps) {
  const [search, setSearch] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const useCompactList = companies.length >= 6

  const filtered = search
    ? companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ico.includes(search)
      )
    : companies

  const handleSelect = (id: string) => {
    if (setAsDefault) {
      onSetDefault(id)
    }
    onSelect(id)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[480px]" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">Vyberte firmu</DialogTitle>
        </DialogHeader>

        {useCompactList && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hledat podle názvu nebo IČO..."
              className="pl-9 h-10"
              autoFocus
            />
          </div>
        )}

        <div className={useCompactList ? 'max-h-[320px] overflow-y-auto space-y-1' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
          {filtered.map(company => (
            <button
              key={company.id}
              onClick={() => handleSelect(company.id)}
              className={`
                w-full text-left transition-all duration-150
                ${useCompactList
                  ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/80'
                  : 'flex flex-col gap-1.5 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm'
                }
              `}
            >
              <div className={`flex items-center gap-2.5 ${useCompactList ? 'flex-1 min-w-0' : ''}`}>
                <Building2 className={`h-4 w-4 text-muted-foreground shrink-0 ${useCompactList ? '' : 'hidden'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!useCompactList && <Building2 className="h-4 w-4 text-blue-600 shrink-0" />}
                    <span className={`font-medium truncate ${useCompactList ? 'text-sm' : 'text-sm'}`}>{company.name}</span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[company.status] || 'bg-gray-400'}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">IČO: {company.ico}</span>
                </div>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm col-span-2">
              Žádná firma neodpovídá hledání
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={e => setSetAsDefault(e.target.checked)}
            className="rounded border-muted-foreground/30"
          />
          Příště otevírat automaticky tuto firmu
        </label>
      </DialogContent>
    </Dialog>
  )
}
