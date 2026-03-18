'use client'

import { useState, useEffect, useCallback } from 'react'
import { Network, TreePine, Table, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GalaxyView, type CompanyNode, type OwnershipLink } from '@/components/company-universe/galaxy-view'
import { CompanyDetailPanel } from '@/components/company-universe/company-detail-panel'
import { cn } from '@/lib/utils'

type ViewMode = 'galaxy' | 'tree' | 'table'

interface GraphData {
  companies: CompanyNode[]
  ownership: OwnershipLink[]
  layout: {
    positions: Record<string, { x: number; y: number }>
  } | null
}

const VIEW_OPTIONS: { id: ViewMode; label: string; icon: typeof Network; enabled: boolean }[] = [
  { id: 'galaxy', label: 'Galaxy', icon: Network, enabled: true },
  { id: 'tree', label: 'Strom', icon: TreePine, enabled: false },
  { id: 'table', label: 'Tabulka', icon: Table, enabled: false },
]

export default function CompanyUniversePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('galaxy')
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const fetchGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/accountant/companies/graph')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGraphData({
        companies: (data.companies || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          name: c.name,
          ico: c.ico || '',
          company_type: c.company_type || 'standalone',
          dph_status: c.vat_payer ? 'payer' : 'non_payer',
          health_score: null,
        })),
        ownership: (data.ownership || []).map((o: Record<string, unknown>) => ({
          source: o.parent_company_id,
          target: o.child_company_id,
          share_percentage: o.share_percentage || 100,
        })),
        layout: data.layout,
      })
    } catch (err) {
      console.error('[Universe] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Chyba pri nacitani')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  const handlePositionsChange = useCallback(async (positions: Record<string, { x: number; y: number }>) => {
    try {
      await fetch('/api/accountant/companies/graph/layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_type: 'galaxy', positions }),
      })
    } catch {
      // Silent fail — layout save is non-critical
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-soft-sm">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Firemni struktura</h1>
            {graphData && (
              <p className="text-xs text-muted-foreground">
                {graphData.companies.length} firem &middot; {graphData.ownership.length} vazeb
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {VIEW_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  onClick={() => opt.enabled && setViewMode(opt.id)}
                  disabled={!opt.enabled}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    viewMode === opt.id
                      ? 'bg-background text-foreground shadow-soft-sm'
                      : opt.enabled
                        ? 'text-muted-foreground hover:text-foreground'
                        : 'text-muted-foreground/40 cursor-not-allowed',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                  {!opt.enabled && <Badge variant="secondary" className="text-[10px] px-1 py-0">Brzy</Badge>}
                </button>
              )
            })}
          </div>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchGraph} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {loading && !graphData ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchGraph}>Zkusit znovu</Button>
          </div>
        ) : graphData && viewMode === 'galaxy' ? (
          <GalaxyView
            companies={graphData.companies}
            links={graphData.ownership}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            savedPositions={graphData.layout?.positions}
            onPositionsChange={handlePositionsChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Pohled &quot;{viewMode}&quot; bude brzy k dispozici
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedCompanyId && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedCompanyId(null)}
          />
          <CompanyDetailPanel
            companyId={selectedCompanyId}
            onClose={() => setSelectedCompanyId(null)}
          />
        </>
      )}
    </div>
  )
}
