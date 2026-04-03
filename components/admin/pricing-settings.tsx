'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DollarSign, Car, FileText, Clock, AlertTriangle, Save } from 'lucide-react'
import { fetchPricingSettings, savePricingSettingsAsync, type PricingSettings } from '@/lib/pricing-settings'

export function PricingSettings() {
  const [settings, setSettings] = useState<PricingSettings | null>(null)
  const [saved, setSaved] = useState(false)

  // Load settings from API (with localStorage fallback)
  useEffect(() => {
    fetchPricingSettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    if (!settings) return

    const ok = await savePricingSettingsAsync(settings)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  // Show loading state while settings are loading
  if (!settings) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Načítám nastavení...</p>
      </div>
    )
  }

  const updateHourlyRate = (type: keyof typeof settings.hourlyRates, value: string) => {
    setSettings({
      ...settings,
      hourlyRates: {
        ...settings.hourlyRates,
        [type]: parseFloat(value) || 0
      }
    })
  }

  const updateTravel = (key: string, value: any) => {
    setSettings({
      ...settings,
      travel: {
        ...settings.travel,
        [key]: value
      }
    })
  }

  const updateFees = (type: keyof typeof settings.fees, value: string) => {
    setSettings({
      ...settings,
      fees: {
        ...settings.fees,
        [type]: parseFloat(value) || 0
      }
    })
  }

  const updatePenalties = (type: keyof typeof settings.penalties, value: string) => {
    setSettings({
      ...settings,
      penalties: {
        ...settings.penalties,
        [type]: parseFloat(value) || 0
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display">Ceník a Sazby</h2>
        <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-green-600 hover:bg-green-700">
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saved ? 'Uloženo' : 'Uložit změny'}
        </Button>
      </div>

      {/* Hodinové sazby */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Hodinové sazby
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="standard" className="text-xs text-gray-500 whitespace-nowrap">Standardní</Label>
              <Input id="standard" type="number" value={settings.hourlyRates.standard} onChange={(e) => updateHourlyRate('standard', e.target.value)} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="expert" className="text-xs text-gray-500 whitespace-nowrap">Expert</Label>
              <Input id="expert" type="number" value={settings.hourlyRates.expert} onChange={(e) => updateHourlyRate('expert', e.target.value)} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="urgent" className="text-xs text-gray-500 whitespace-nowrap">Urgentní</Label>
              <Input id="urgent" type="number" value={settings.hourlyRates.urgent} onChange={(e) => updateHourlyRate('urgent', e.target.value)} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč/h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="partner" className="text-xs text-gray-500 whitespace-nowrap">Partner</Label>
              <Input id="partner" type="number" value={settings.hourlyRates.partner} onChange={(e) => updateHourlyRate('partner', e.target.value)} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč/h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doprava */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Car className="h-3.5 w-3.5" />
            Doprava
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap shrink-0">Typ</Label>
            <div className="flex gap-1">
              {(['fixed', 'per-km', 'both'] as const).map(t => (
                <Button
                  key={t}
                  variant={settings.travel.type === t ? 'default' : 'outline'}
                  onClick={() => updateTravel('type', t)}
                  size="sm"
                  className={`h-7 text-xs ${settings.travel.type === t ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
                >
                  {t === 'fixed' ? 'Fixní' : t === 'per-km' ? 'Na km' : 'Obojí'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="fixedRate" className="text-xs text-gray-500 whitespace-nowrap">Fixní/cestu</Label>
              <Input id="fixedRate" type="number" value={settings.travel.fixedRate} onChange={(e) => updateTravel('fixedRate', parseFloat(e.target.value) || 0)} disabled={settings.travel.type === 'per-km'} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="perKmRate" className="text-xs text-gray-500 whitespace-nowrap">Na km</Label>
              <Input id="perKmRate" type="number" value={settings.travel.perKmRate} onChange={(e) => updateTravel('perKmRate', parseFloat(e.target.value) || 0)} disabled={settings.travel.type === 'fixed'} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč/km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="minDistance" className="text-xs text-gray-500 whitespace-nowrap">Min. vzd.</Label>
              <Input id="minDistance" type="number" value={settings.travel.minDistance} onChange={(e) => updateTravel('minDistance', parseFloat(e.target.value) || 0)} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">km</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poplatky */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Poplatky (přirážky)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="court" className="text-xs text-gray-500 whitespace-nowrap">Soudní</Label>
              <Input id="court" type="number" value={settings.fees.court} onChange={(e) => updateFees('court', e.target.value)} className="h-8 w-16 text-sm text-right" />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="administrative" className="text-xs text-gray-500 whitespace-nowrap">Úřední</Label>
              <Input id="administrative" type="number" value={settings.fees.administrative} onChange={(e) => updateFees('administrative', e.target.value)} className="h-8 w-16 text-sm text-right" />
              <span className="text-xs text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="other" className="text-xs text-gray-500 whitespace-nowrap">Ostatní</Label>
              <Input id="other" type="number" value={settings.fees.other} onChange={(e) => updateFees('other', e.target.value)} className="h-8 w-16 text-sm text-right" />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">0% = plná výše, 10% = přidáme 10% marži k poplatku</p>
        </CardContent>
      </Card>

      {/* Penalties */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2 text-orange-900 dark:text-orange-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Penalizace
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="latePayment" className="text-xs text-gray-500 whitespace-nowrap">Úrok z prodlení</Label>
              <Input id="latePayment" type="number" step="0.01" value={settings.penalties.latePayment * 100} onChange={(e) => updatePenalties('latePayment', (parseFloat(e.target.value) / 100).toString())} className="h-8 w-20 text-sm text-right" />
              <span className="text-xs text-gray-400">%/měs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="missedDeadline" className="text-xs text-gray-500 whitespace-nowrap">Zmeškaný deadline</Label>
              <Input id="missedDeadline" type="number" value={settings.penalties.missedDeadline} onChange={(e) => updatePenalties('missedDeadline', e.target.value)} className="h-8 w-24 text-sm text-right" />
              <span className="text-xs text-gray-400">Kč</span>
            </div>
          </div>
          <p className="text-[10px] text-orange-700 dark:text-orange-400">Penalizace musí být smluvně ošetřeny v mandátní smlouvě.</p>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" />
            Příklad fakturace
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Expert 10h × {settings.hourlyRates.expert} Kč</span>
              <span className="font-semibold">{(10 * settings.hourlyRates.expert).toLocaleString()} Kč</span>
            </div>
            <div className="flex justify-between">
              <span>Urgentní 2h × {settings.hourlyRates.urgent} Kč</span>
              <span className="font-semibold">{(2 * settings.hourlyRates.urgent).toLocaleString()} Kč</span>
            </div>
            {settings.travel.type !== 'fixed' && (
              <div className="flex justify-between">
                <span>Doprava 50 km × {settings.travel.perKmRate} Kč</span>
                <span className="font-semibold">{(50 * settings.travel.perKmRate).toLocaleString()} Kč</span>
              </div>
            )}
            {settings.travel.type === 'fixed' && (
              <div className="flex justify-between">
                <span>Doprava (fixní)</span>
                <span className="font-semibold">{settings.travel.fixedRate.toLocaleString()} Kč</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-bold">
              <span>Celkem bez DPH:</span>
              <span>
                {(
                  10 * settings.hourlyRates.expert +
                  2 * settings.hourlyRates.urgent +
                  (settings.travel.type === 'fixed' ? settings.travel.fixedRate : 50 * settings.travel.perKmRate)
                ).toLocaleString()} Kč
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
