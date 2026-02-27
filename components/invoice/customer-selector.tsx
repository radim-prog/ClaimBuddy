'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyCombobox } from '@/components/ui/company-combobox'
import { Building2, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export interface CustomerData {
  company_id?: string
  name: string
  ico: string
  dic: string
  address: string
  city: string
  zip: string
}

interface CustomerSelectorProps {
  companies: { id: string; name: string; ico?: string; dic?: string; address?: any }[]
  value: CustomerData
  onChange: (data: CustomerData) => void
}

export function CustomerSelector({ companies, value, onChange }: CustomerSelectorProps) {
  const [aresLoading, setAresLoading] = useState(false)

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (!company) return
    const addr = company.address || {}
    onChange({
      company_id: company.id,
      name: company.name,
      ico: company.ico || '',
      dic: company.dic || '',
      address: typeof addr === 'object' ? (addr.street || '') : String(addr),
      city: typeof addr === 'object' ? (addr.city || '') : '',
      zip: typeof addr === 'object' ? (addr.zip || '') : '',
    })
  }

  const handleAresLookup = async () => {
    if (value.ico.length !== 8) {
      toast.error('Zadejte 8mistne ICO')
      return
    }
    setAresLoading(true)
    try {
      const res = await fetch(`/api/ares?ico=${value.ico}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Firma nenalezena')
        return
      }
      const c = data.company
      onChange({
        ...value,
        name: c.name || value.name,
        dic: c.dic || value.dic,
        address: c.address?.street || value.address,
        city: c.address?.city || value.city,
        zip: c.address?.zip || value.zip,
      })
      toast.success('Data nactena z ARES')
    } catch {
      toast.error('Nepodarilo se spojit s ARES')
    } finally {
      setAresLoading(false)
    }
  }

  const update = (key: keyof CustomerData, val: string) => {
    onChange({ ...value, [key]: val })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Odběratel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company selector */}
        <div className="space-y-2">
          <Label>Vybrat z databáze</Label>
          <CompanyCombobox
            companies={companies}
            value={value.company_id || ''}
            onValueChange={handleCompanySelect}
            placeholder="Vyberte odberatele..."
            triggerClassName="w-full"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">nebo zadat rucne</span>
          </div>
        </div>

        {/* IČO + ARES */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">ICO</Label>
            <div className="flex gap-1">
              <Input
                value={value.ico}
                onChange={e => update('ico', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                className="font-mono"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAresLookup}
                disabled={aresLoading || value.ico.length !== 8}
                className="shrink-0"
              >
                {aresLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">DIC</Label>
            <Input value={value.dic} onChange={e => update('dic', e.target.value)} placeholder="CZ12345678" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nazev firmy *</Label>
            <Input value={value.name} onChange={e => update('name', e.target.value)} placeholder="Firma s.r.o." />
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Ulice</Label>
            <Input value={value.address} onChange={e => update('address', e.target.value)} placeholder="Na Porici 12" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mesto</Label>
            <Input value={value.city} onChange={e => update('city', e.target.value)} placeholder="Praha" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">PSC</Label>
            <Input value={value.zip} onChange={e => update('zip', e.target.value)} placeholder="110 00" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
