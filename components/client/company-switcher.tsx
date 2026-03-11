'use client'

import { useClientUser } from '@/lib/contexts/client-user-context'
import { Building2, ChevronDown } from 'lucide-react'

export function CompanySwitcher({ collapsed }: { collapsed?: boolean }) {
  const { companies, selectedCompanyId, setSelectedCompanyId, selectedCompany } = useClientUser()

  if (companies.length === 0) return null

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
        </div>
      </div>
    )
  }

  // Multiple companies — dropdown
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
            <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <select
          value={selectedCompanyId}
          onChange={e => setSelectedCompanyId(e.target.value)}
          className="w-full appearance-none bg-white/[0.08] text-white/80 text-xs font-medium rounded-lg px-3 py-2 pr-7 border border-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          {companies.map(c => (
            <option key={c.id} value={c.id} className="text-gray-900 bg-white">{c.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
      </div>
    </div>
  )
}
