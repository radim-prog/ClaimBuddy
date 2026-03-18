'use client'

import { useEffect, useState, useCallback } from 'react'
import { GalaxyView, CompanyNode, OwnershipLink } from '@/components/company-universe/galaxy-view'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { Network, Building2, MapPin, FileText, X } from 'lucide-react'

type GraphCompany = {
  id: string
  name: string
  ico: string
  dic: string | null
  company_type: string
  dph_status: string
  status: string
  address: { street?: string; city?: string; zip?: string } | string | null
  managing_director: string | null
}

type GraphResponse = {
  companies: GraphCompany[]
  ownership: OwnershipLink[]
}

const POSITIONS_KEY = 'client-universe-positions'

export default function CompanyUniversePage() {
  const { companies: userCompanies } = useClientUser()
  const [graphData, setGraphData] = useState<GraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }> | undefined>()

  // Load saved positions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(POSITIONS_KEY)
      if (saved) setSavedPositions(JSON.parse(saved))
    } catch {}
  }, [])

  // Fetch graph data
  useEffect(() => {
    setLoading(true)
    fetch('/api/client/companies/graph')
      .then(r => {
        if (!r.ok) throw new Error('Nepodařilo se načíst data')
        return r.json()
      })
      .then((data: GraphResponse) => {
        setGraphData(data)
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handlePositionsChange = useCallback((positions: Record<string, { x: number; y: number }>) => {
    try {
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions))
    } catch {}
  }, [])

  const selectedCompany = graphData?.companies.find(c => c.id === selectedId)

  // Map to GalaxyView format
  const nodes: CompanyNode[] = (graphData?.companies ?? []).map(c => ({
    id: c.id,
    name: c.name,
    ico: c.ico,
    company_type: c.company_type as CompanyNode['company_type'],
    dph_status: c.dph_status as CompanyNode['dph_status'],
    health_score: null,
  }))

  const links: OwnershipLink[] = graphData?.ownership ?? []

  function formatAddress(addr: GraphCompany['address']): string | null {
    if (!addr) return null
    if (typeof addr === 'string') return addr
    const parts = [addr.street, addr.city, addr.zip].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Načítám strukturu firem...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    )
  }

  if (nodes.length < 2) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Network className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Pro zobrazení propojení potřebujete alespoň 2 firmy.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <Network className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Moje firmy</h1>
          <p className="text-sm text-muted-foreground">
            {nodes.length} firem{links.length > 0 ? ` · ${links.length} vazeb` : ''}
          </p>
        </div>
      </div>

      {/* Graph */}
      <div className="relative rounded-xl border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
        <GalaxyView
          companies={nodes}
          links={links}
          onSelectCompany={(id) => setSelectedId(id)}
          savedPositions={savedPositions}
          onPositionsChange={handlePositionsChange}
        />

        {/* Detail panel (slide from right) */}
        {selectedCompany && (
          <div className="absolute top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-sm border-l border-border shadow-lg overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="p-5 space-y-5">
              {/* Close button */}
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Company name + type badge */}
              <div className="pr-8">
                <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded mb-2 ${
                  selectedCompany.company_type === 'holding' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                  selectedCompany.company_type === 'daughter' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                  selectedCompany.company_type === 'person' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {selectedCompany.company_type === 'holding' ? 'Holding' :
                   selectedCompany.company_type === 'daughter' ? 'Dceřiná' :
                   selectedCompany.company_type === 'person' ? 'Fyzická osoba' :
                   'Samostatná'}
                </span>
                <h2 className="text-lg font-semibold">{selectedCompany.name}</h2>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <DetailRow icon={Building2} label="IČO" value={selectedCompany.ico} />
                {selectedCompany.dic && (
                  <DetailRow icon={FileText} label="DIČ" value={selectedCompany.dic} />
                )}
                <DetailRow
                  icon={FileText}
                  label="DPH"
                  value={selectedCompany.dph_status === 'payer' ? 'Plátce DPH' : 'Neplátce'}
                  valueClassName={selectedCompany.dph_status === 'payer' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
                />
                {selectedCompany.managing_director && (
                  <DetailRow icon={Building2} label="Jednatel" value={selectedCompany.managing_director} />
                )}
                {formatAddress(selectedCompany.address) && (
                  <DetailRow icon={MapPin} label="Adresa" value={formatAddress(selectedCompany.address)!} />
                )}
              </div>

              {/* Ownership connections */}
              {links.filter(l => l.source === selectedId || l.target === selectedId).length > 0 && (
                <div className="pt-3 border-t border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Vazby</h3>
                  <div className="space-y-1.5">
                    {links.filter(l => l.source === selectedId || l.target === selectedId).map((link, i) => {
                      const isParent = link.source === selectedId
                      const otherId = isParent ? link.target : link.source
                      const other = graphData?.companies.find(c => c.id === otherId)
                      if (!other) return null
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedId(otherId)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium">{other.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {isParent ? 'Vlastní' : 'Vlastněna'} · {link.share_percentage}%
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Building2
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium ${valueClassName || ''}`}>{value}</p>
      </div>
    </div>
  )
}
