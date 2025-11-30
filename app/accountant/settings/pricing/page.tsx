'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DollarSign, Car, FileText, Clock, AlertTriangle, Save, Settings as SettingsIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPricingSettings, savePricingSettings, type PricingSettings } from '@/lib/pricing-settings'
import Link from 'next/link'

export default function PricingSettingsPage() {
  const [settings, setSettings] = useState<PricingSettings | null>(null)
  const [saved, setSaved] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(getPricingSettings())
  }, [])

  const handleSave = () => {
    if (!settings) return

    savePricingSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Show loading state while settings are loading
  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Načítám nastavení...</p>
        </div>
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
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
      {/* Tabs Navigation */}
      <div>
        <h1 className="text-3xl font-bold mb-4">Nastavení</h1>
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <Link
            href="/accountant/settings"
            className="px-4 py-2 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Obecné nastavení
            </div>
          </Link>
          <div className="px-4 py-2 font-medium border-b-2 border-blue-600 text-blue-600">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ceník a Sazby
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ceník a Sazby</h2>
          <p className="text-gray-600 mt-2">Nastavení hodinových sazeb, dopravy a poplatků pro fakturaci</p>
        </div>
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          {saved ? 'Uloženo ✓' : 'Uložit změny'}
        </Button>
      </div>

      {/* Hodinové sazby */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hodinové Sazby
          </CardTitle>
          <CardDescription>Sazby za odpracované hodiny podle typu práce</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="standard">Standardní práce</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="standard"
                  type="number"
                  value={settings.hourlyRates.standard}
                  onChange={(e) => updateHourlyRate('standard', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">Kč/hod</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Běžné účetní práce, uzávěrky</p>
            </div>

            <div>
              <Label htmlFor="expert">Expert / Daňová kontrola</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="expert"
                  type="number"
                  value={settings.hourlyRates.expert}
                  onChange={(e) => updateHourlyRate('expert', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">Kč/hod</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Náročné případy, kontroly FÚ</p>
            </div>

            <div>
              <Label htmlFor="urgent">Urgentní práce</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="urgent"
                  type="number"
                  value={settings.hourlyRates.urgent}
                  onChange={(e) => updateHourlyRate('urgent', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">Kč/hod</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Práce mimo pracovní dobu, urgence</p>
            </div>

            <div>
              <Label htmlFor="partner">Práce partnera</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="partner"
                  type="number"
                  value={settings.hourlyRates.partner}
                  onChange={(e) => updateHourlyRate('partner', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">Kč/hod</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Senior partner, konzultace</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doprava */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Doprava
          </CardTitle>
          <CardDescription>Účtování dopravy ke klientovi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Typ účtování</Label>
            <div className="flex gap-2 mt-2">
              <Button
                variant={settings.travel.type === 'fixed' ? 'default' : 'outline'}
                onClick={() => updateTravel('type', 'fixed')}
                size="sm"
                className={settings.travel.type === 'fixed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              >
                Fixní sazba
              </Button>
              <Button
                variant={settings.travel.type === 'per-km' ? 'default' : 'outline'}
                onClick={() => updateTravel('type', 'per-km')}
                size="sm"
                className={settings.travel.type === 'per-km' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              >
                Na kilometry
              </Button>
              <Button
                variant={settings.travel.type === 'both' ? 'default' : 'outline'}
                onClick={() => updateTravel('type', 'both')}
                size="sm"
                className={settings.travel.type === 'both' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
              >
                Obojí
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fixedRate">Fixní sazba za cestu</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="fixedRate"
                  type="number"
                  value={settings.travel.fixedRate}
                  onChange={(e) => updateTravel('fixedRate', parseFloat(e.target.value) || 0)}
                  disabled={settings.travel.type === 'per-km'}
                  className="text-right"
                />
                <span className="text-gray-600">Kč</span>
              </div>
            </div>

            <div>
              <Label htmlFor="perKmRate">Sazba na km</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="perKmRate"
                  type="number"
                  value={settings.travel.perKmRate}
                  onChange={(e) => updateTravel('perKmRate', parseFloat(e.target.value) || 0)}
                  disabled={settings.travel.type === 'fixed'}
                  className="text-right"
                />
                <span className="text-gray-600">Kč/km</span>
              </div>
            </div>

            <div>
              <Label htmlFor="minDistance">Min. vzdálenost</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="minDistance"
                  type="number"
                  value={settings.travel.minDistance}
                  onChange={(e) => updateTravel('minDistance', parseFloat(e.target.value) || 0)}
                  className="text-right"
                />
                <span className="text-gray-600">km</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Neúčtuje se pod tuto vzdálenost</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poplatky */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Poplatky
          </CardTitle>
          <CardDescription>Přirážky k nákladům klienta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="court">Soudní poplatky</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="court"
                  type="number"
                  value={settings.fees.court}
                  onChange={(e) => updateFees('court', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="administrative">Úřední poplatky</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="administrative"
                  type="number"
                  value={settings.fees.administrative}
                  onChange={(e) => updateFees('administrative', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="other">Ostatní poplatky</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="other"
                  type="number"
                  value={settings.fees.other}
                  onChange={(e) => updateFees('other', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            💡 Tip: 0% = poplatky účtujeme v plné výši, 10% = přidáme 10% k poplatku jako marži
          </p>
        </CardContent>
      </Card>

      {/* Penalties */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="h-5 w-5" />
            Poplatky za Promeškání
          </CardTitle>
          <CardDescription>Penalizace za zpožděné platby a zmešk ané deadlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latePayment">Úrok z prodlení</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="latePayment"
                  type="number"
                  step="0.01"
                  value={settings.penalties.latePayment * 100}
                  onChange={(e) => updatePenalties('latePayment', (parseFloat(e.target.value) / 100).toString())}
                  className="text-right"
                />
                <span className="text-gray-600">% měsíčně</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Např. 0.05 = 0.05% za každý měsíc prodlení</p>
            </div>

            <div>
              <Label htmlFor="missedDeadline">Zmeškaný deadline klienta</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="missedDeadline"
                  type="number"
                  value={settings.penalties.missedDeadline}
                  onChange={(e) => updatePenalties('missedDeadline', e.target.value)}
                  className="text-right"
                />
                <span className="text-gray-600">Kč</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Fixní poplatek pokud klient nestihl dodať podklady</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-xs text-orange-800">
              ⚠️ <strong>Upozornění:</strong> Penalizace musí být smluvně ošetřeny v mandátní smlouvě s klientem.
              Automatické připočítání penalty bez právního základu může být neplatné.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Příklad Fakturace
          </CardTitle>
          <CardDescription>Ukázka výpočtu pro typickou daňovou kontrolu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Expert práce (10h × {settings.hourlyRates.expert} Kč)</span>
              <span className="font-semibold">{(10 * settings.hourlyRates.expert).toLocaleString()} Kč</span>
            </div>
            <div className="flex justify-between">
              <span>Urgentní práce (2h × {settings.hourlyRates.urgent} Kč)</span>
              <span className="font-semibold">{(2 * settings.hourlyRates.urgent).toLocaleString()} Kč</span>
            </div>
            {settings.travel.type !== 'fixed' && (
              <div className="flex justify-between">
                <span>Doprava (50 km × {settings.travel.perKmRate} Kč)</span>
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
            <div className="flex justify-between text-lg font-bold">
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
