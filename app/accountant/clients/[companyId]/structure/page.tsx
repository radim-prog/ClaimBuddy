'use client'

import { useState, useEffect, useCallback } from 'react'
import { Network, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GalaxyView, type CompanyNode, type OwnershipLink } from '@/components/company-universe/galaxy-view'
import { CompanyDetailPanel } from '@/components/company-universe/company-detail-panel'
import { useCompany } from '../layout'

export default function StructurePage() {
  const { company } = useCompany()
  const [companies, setCompanies] = useState<CompanyNode[]>([])
  const [links, setLinks] = useState<OwnershipLink[]>([])
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number; y: number }> | undefined>()
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

      const allCompanies: CompanyNode[] = (data.companies || []).map((c: Record<string, unknown>) => ({
        id: c.id,
        name: c.name as string,
        ico: (c.ico as string) || '',
        company_type: (c.company_type as string) || 'standalone',
        dph_status: c.vat_payer ? 'payer' : 'non_payer',
        health_score: null,
        description: (c.description as string) || null,
        nickname: (c.nickname as string) || null,
      }))

      const allLinks: OwnershipLink[] = (data.ownership || []).map((o: Record<string, unknown>) => ({
        source: o.parent_company_id as string,
        target: o.child_company_id as string,
        share_percentage: (o.share_percentage as number) || 100,
      }))

      // Find all companies connected to current company (direct + indirect)
      const connectedIds = new Set<string>([company.id])
      let changed = true
      while (changed) {
        changed = false
        for (const link of allLinks) {
          if (connectedIds.has(link.source) && !connectedIds.has(link.target)) {
            connectedIds.add(link.target)
            changed = true
          }
          if (connectedIds.has(link.target) && !connectedIds.has(link.source)) {
            connectedIds.add(link.source)
            changed = true
          }
        }
      }

      setCompanies(allCompanies.filter(c => connectedIds.has(c.id)))
      setLinks(allLinks.filter(l => connectedIds.has(l.source) && connectedIds.has(l.target)))
      setSavedPositions(data.layout?.positions)
    } catch (err) {
      console.error('[Structure] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Chyba při načítání')
    } finally {
      setLoading(false)
    }
  }, [company.id])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  const handlePositionsChange = useCallback(async (positions: Record<string, { x: number; y: number }>) => {
    try {
      await fetch('/api/accountant/companies/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_type: 'galaxy', positions }),
      })
    } catch {
      // Silent fail
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold">Vlastnická struktura</h2>
          {companies.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {companies.length} firem &middot; {links.length} vazeb
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" className="h-7" onClick={fetchGraph} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Obnovit
        </Button>
      </div>

      <div className="flex-1 relative min-h-[400px]">
        {loading && companies.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchGraph}>Zkusit znovu</Button>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Network className="h-10 w-10 opacity-30" />
            <p className="text-sm">Tato firma nemá žádné vlastnické vazby</p>
          </div>
        ) : (
          <GalaxyView
            companies={companies}
            links={links}
            onSelectCompany={(id) => setSelectedCompanyId(id)}
            savedPositions={savedPositions}
            onPositionsChange={handlePositionsChange}
          />
        )}
      </div>

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
