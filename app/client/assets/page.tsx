'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Loader2 } from 'lucide-react'
import { useClientUser } from '@/lib/contexts/client-user-context'

const CATEGORY_LABELS: Record<string, string> = {
  vehicle: 'Automobil',
  electronics: 'Elektronika',
  real_estate: 'Nemovitost',
  machinery: 'Stroje',
  equipment: 'Vybavení',
  other: 'Ostatní',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'V užívání',
  sold: 'Prodáno',
  disposed: 'Vyřazeno',
  written_off: 'Odepsáno',
}

type Asset = {
  id: string
  name: string
  category: string
  acquisition_price: number
  acquisition_date: string
  status: string
  current_value?: number
  depreciation_group?: string
}

export default function ClientAssetsPage() {
  const { selectedCompanyId, selectedCompany } = useClientUser()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  const sectionEnabled = selectedCompany?.portal_sections?.assets !== false

  useEffect(() => {
    if (!selectedCompanyId || !sectionEnabled) return
    setLoading(true)
    fetch(`/api/client/assets?company_id=${selectedCompanyId}`)
      .then(r => r.json())
      .then(data => setAssets(data.assets || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [selectedCompanyId, sectionEnabled])

  if (!sectionEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">Tato sekce není aktivní. Kontaktujte svou účetní.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    )
  }

  const totalValue = assets.reduce((s, a) => s + (a.current_value ?? a.acquisition_price), 0)
  const activeCount = assets.filter(a => a.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
          <Package className="h-6 w-6 text-purple-600" />
          Majetek
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Přehled majetku vaší firmy</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Celkem položek</div>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Aktivní</div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Celková hodnota</div>
            <div className="text-2xl font-bold">{totalValue.toLocaleString('cs')} Kč</div>
          </CardContent>
        </Card>
      </div>

      {assets.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            Žádný majetek k zobrazení
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assets.map(asset => (
            <Card key={asset.id} className="rounded-xl">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {CATEGORY_LABELS[asset.category] || asset.category}
                      {' • '}
                      Pořízeno {new Date(asset.acquisition_date).toLocaleDateString('cs')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold">{(asset.current_value ?? asset.acquisition_price).toLocaleString('cs')} Kč</div>
                    <Badge variant="outline" className={`text-xs ${
                      asset.status === 'active' ? 'text-green-600 border-green-200 dark:text-green-400 dark:border-green-800' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {STATUS_LABELS[asset.status] || asset.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
