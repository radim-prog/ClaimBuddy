'use client'

import { useClientUser } from '@/lib/contexts/client-user-context'
import { Building2, ChevronDown, Plus, Clock } from 'lucide-react'
import { AddCompanyDialog } from '@/components/client/add-company-dialog'

export function CompanySwitcher({ collapsed }: { collapsed?: boolean }) {
  const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany, refetch, setShowCompanyPicker } = useClientUser()

  if (companies.length === 0) {
    // No companies — show add button
    if (collapsed) return null
    return (
      <div className="px-3 py-2">
        <AddCompanyDialog
          onCompanyAdded={refetch}
          trigger={
            <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/[0.08] rounded-lg transition-colors border border-dashed border-white/15 hover:border-white/30">
              <Plus className="h-4 w-4" />
              Přidat firmu
            </button>
          }
        />
      </div>
    )
  }

  const isPending = selectedCompany?.status === 'pending_review'

  // Single company — just show name
  if (companies.length === 1) {
    if (collapsed) {
      return (
        <div className="flex justify-center px-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center" title={companies[0].name}>
            <Building2 className="h-4 w-4 text-white/60" />
          </div>
        </div>
      )
    }
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <Building2 className="h-3.5 w-3.5 text-white/40 shrink-0" />
          <span className="truncate font-medium">{companies[0].name}</span>
          {companies[0].status === 'pending_review' && (
            <span title="Čeká na schválení"><Clock className="h-3 w-3 text-amber-400 shrink-0" /></span>
          )}
        </div>
        <AddCompanyDialog
          onCompanyAdded={refetch}
          trigger={
            <button className="mt-1.5 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Přidat další firmu
            </button>
          }
        />
      </div>
    )
  }

  // Multiple companies — dropdown + add button
  if (collapsed) {
    return (
      <div className="flex justify-center px-3 py-2">
        <select
          value={selectedCompanyId}
          onChange={e => setSelectedCompanyId(e.target.value)}
          className="w-8 h-8 rounded-lg bg-white/10 text-transparent cursor-pointer appearance-none text-center"
          title={selectedCompany?.name || 'Vybrat firmu'}
          style={{ backgroundImage: 'none' }}
        >
          {companies.map(c => (
            <option key={c.id} value={c.id} className="text-gray-900">
              {c.name}{c.status === 'pending_review' ? ' (čeká)' : ''}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 space-y-1">
      <div className="relative">
        <select
          value={selectedCompanyId}
          onChange={e => setSelectedCompanyId(e.target.value)}
          className="w-full appearance-none bg-white/[0.08] text-white/80 text-xs font-medium rounded-lg px-3 py-2 pr-7 border border-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          {companies.map(c => (
            <option key={c.id} value={c.id} className="text-gray-900 bg-white">
              {c.name}{c.status === 'pending_review' ? ' (čeká na schválení)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
      </div>
      {isPending && (
        <div className="flex items-center gap-1 px-1 text-[10px] text-amber-400/80">
          <Clock className="h-3 w-3" />
          Čeká na schválení účetním
        </div>
      )}
      <div className="flex items-center gap-3">
        <AddCompanyDialog
          onCompanyAdded={refetch}
          trigger={
            <button className="flex items-center gap-1.5 px-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Přidat firmu
            </button>
          }
        />
        <button
          onClick={() => setShowCompanyPicker(true)}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <Building2 className="h-3 w-3" />
          Všechny firmy
        </button>
      </div>
    </div>
  )
}
