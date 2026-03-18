'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const COMPANY_TYPES = [
  { label: 'Fyzická osoba', color: 'bg-amber-500' },
  { label: 'Holding', color: 'bg-red-500' },
  { label: 'Sub-holding', color: 'bg-orange-500' },
  { label: 'Dceřiná', color: 'bg-indigo-500' },
  { label: 'Vnukovská', color: 'bg-purple-500' },
  { label: 'Přímo vlastněná', color: 'bg-green-500' },
  { label: 'Externí', color: 'bg-stone-500' },
]

const DPH_STATUSES = [
  { label: 'Plátce DPH', color: 'bg-emerald-500' },
  { label: 'V procesu', color: 'bg-amber-400' },
  { label: 'Neplátce', color: 'bg-red-400' },
]

export function GraphLegend() {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-background/95 backdrop-blur border border-border rounded-lg shadow-md overflow-hidden max-w-[200px]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
      >
        Legenda
        <ChevronDown className={cn('h-3 w-3 transition-transform', !open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            {COMPANY_TYPES.map(t => (
              <div key={t.label} className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', t.color)} />
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">DPH Status</div>
            {DPH_STATUSES.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full ring-2 ring-foreground/20 flex-shrink-0', s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
