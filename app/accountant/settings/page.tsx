'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useSettings, AlertSettings } from '@/lib/contexts/settings-context'
import { Check, RotateCcw, Calendar, Banknote } from 'lucide-react'
import { toast } from 'sonner'

export default function AccountantSettingsPage() {
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings()
  const [localSettings, setLocalSettings] = useState<AlertSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [deadlineDay, setDeadlineDay] = useState(15)
  const [deadlineSaving, setDeadlineSaving] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(700)
  const [kmRate, setKmRate] = useState(4.5)
  const [wastedTimeRate, setWastedTimeRate] = useState(350)
  const [ratesSaving, setRatesSaving] = useState(false)

  // Fetch global settings from DB
  useEffect(() => {
    fetch('/api/accountant/settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.deadline_day) setDeadlineDay(Number(data.settings.deadline_day))
        if (data.settings?.default_hourly_rate) setHourlyRate(Number(data.settings.default_hourly_rate))
        if (data.settings?.default_km_rate) setKmRate(Number(data.settings.default_km_rate))
        if (data.settings?.default_wasted_time_rate) setWastedTimeRate(Number(data.settings.default_wasted_time_rate))
      })
      .catch(() => {})
  }, [])

  const handleRatesSave = async () => {
    setRatesSaving(true)
    try {
      const res = await fetch('/api/accountant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_hourly_rate: hourlyRate,
          default_km_rate: kmRate,
          default_wasted_time_rate: wastedTimeRate,
        }),
      })
      if (res.ok) {
        toast.success('Sazby uloženy')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setRatesSaving(false)
    }
  }

  const handleDeadlineDaySave = async () => {
    setDeadlineSaving(true)
    try {
      const res = await fetch('/api/accountant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline_day: deadlineDay }),
      })
      if (res.ok) {
        toast.success('Deadline den uložen')
      } else {
        toast.error('Chyba při ukládání')
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setDeadlineSaving(false)
    }
  }

  // Sync local state with context when loaded
  useEffect(() => {
    if (isLoaded) {
      setLocalSettings(settings)
    }
  }, [isLoaded, settings])

  const handleChange = (key: keyof AlertSettings, value: number | boolean) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    updateSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    resetSettings()
    setSaved(false)
  }

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-64">Načítání...</div>
  }

  return (
    <div className="grid gap-6">
      {/* Globální deadline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Deadline podkladů
          </CardTitle>
          <CardDescription>
            Den v měsíci do kdy musí klienti dodat podklady pro uzávěrku
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label htmlFor="deadlineDay">Den v měsíci (1-28)</Label>
              <Input
                id="deadlineDay"
                type="number"
                min="1"
                max="28"
                value={deadlineDay}
                onChange={(e) => setDeadlineDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground">
                Např. 15 = klienti musí dodat podklady do 15. dne následujícího měsíce
              </p>
            </div>
            <Button onClick={handleDeadlineDaySave} disabled={deadlineSaving}>
              {deadlineSaving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Výchozí sazby */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Výchozí sazby
          </CardTitle>
          <CardDescription>
            Výchozí hodinové sazby a sazby za km pro kalkulace prepaid projektů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hodinová sazba (Kč/hod)</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Výchozí sazba za hodinu práce
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kmRate">Sazba za km (Kč/km)</Label>
              <Input
                id="kmRate"
                type="number"
                min="0"
                step="0.5"
                value={kmRate}
                onChange={(e) => setKmRate(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Náhrada za 1 km jízdy (tam i zpět)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wastedTimeRate">Promeškaný čas (Kč/hod)</Label>
              <Input
                id="wastedTimeRate"
                type="number"
                min="0"
                step="50"
                value={wastedTimeRate}
                onChange={(e) => setWastedTimeRate(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Snížená sazba za čas strávený cestou
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleRatesSave} disabled={ratesSaving}>
              {ratesSaving ? 'Ukládám...' : 'Uložit sazby'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifikace */}
      <Card>
        <CardHeader>
          <CardTitle>Notifikace</CardTitle>
          <CardDescription>
            Nastavte jak chcete dostávat upozornění
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifikace</Label>
              <p className="text-sm text-muted-foreground">
                Dostávejte emailové upozornění o nových dokumentech
              </p>
            </div>
            <Switch
              checked={localSettings.emailNotifications}
              onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS notifikace</Label>
              <p className="text-sm text-muted-foreground">
                Dostávejte SMS upozornění o urgentních záležitostech
              </p>
            </div>
            <Switch
              checked={localSettings.smsNotifications}
              onCheckedChange={(checked) => handleChange('smsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prahy pro upozornění - Dokumenty */}
      <Card>
        <CardHeader>
          <CardTitle>Prahy upozornění - Dokumenty</CardTitle>
          <CardDescription>
            Nastavte kdy se zobrazí upozornění na chybějící dokumenty a blížící se deadliny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentCriticalDays">
                Kritický stav (dní před deadlinem)
              </Label>
              <Input
                id="documentCriticalDays"
                type="number"
                min="0"
                max="30"
                value={localSettings.documentCriticalDays}
                onChange={(e) => handleChange('documentCriticalDays', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Červené upozornění když zbývá méně dní do deadlinu
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentUrgentDays">
                Urgentní stav (dní před deadlinem)
              </Label>
              <Input
                id="documentUrgentDays"
                type="number"
                min="0"
                max="30"
                value={localSettings.documentUrgentDays}
                onChange={(e) => handleChange('documentUrgentDays', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Oranžové upozornění když zbývá méně dní do deadlinu
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="closureDeadlineDay">Deadline uzávěrky (den v měsíci)</Label>
            <Input
              id="closureDeadlineDay"
              type="number"
              min="1"
              max="28"
              value={localSettings.closureDeadlineDay}
              onChange={(e) => handleChange('closureDeadlineDay', parseInt(e.target.value) || 10)}
            />
            <p className="text-xs text-muted-foreground">
              Den v následujícím měsíci kdy musí být uzávěrka hotová (např. 10 = 10. den)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Prahy pro upozornění - Úkoly */}
      <Card>
        <CardHeader>
          <CardTitle>Prahy upozornění - Úkoly</CardTitle>
          <CardDescription>
            Nastavte kdy se zobrazí upozornění na úkoly po termínu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskOverdueCriticalDays">
                Kritický stav (dní po termínu)
              </Label>
              <Input
                id="taskOverdueCriticalDays"
                type="number"
                min="0"
                max="30"
                value={localSettings.taskOverdueCriticalDays}
                onChange={(e) => handleChange('taskOverdueCriticalDays', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Červené upozornění po tolika dnech po termínu (0 = ihned)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskOverdueUrgentDays">
                Urgentní stav (dní před termínem)
              </Label>
              <Input
                id="taskOverdueUrgentDays"
                type="number"
                min="0"
                max="30"
                value={localSettings.taskOverdueUrgentDays}
                onChange={(e) => handleChange('taskOverdueUrgentDays', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Oranžové upozornění když zbývá méně dní do termínu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding klientů</CardTitle>
          <CardDescription>
            Nastavení procesu onboardingu nových klientů
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="onboardingStalledDays">Dní bez aktivity = zaseklý</Label>
              <Input
                id="onboardingStalledDays"
                type="number"
                min="1"
                max="60"
                value={localSettings.onboardingStalledDays}
                onChange={(e) => handleChange('onboardingStalledDays', parseInt(e.target.value) || 7)}
              />
              <p className="text-xs text-muted-foreground">
                Klienti bez aktivity po tento počet dní budou označeni jako "zaseklí"
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboardingLowProgressPercent">Práh nízkého postupu (%)</Label>
              <Input
                id="onboardingLowProgressPercent"
                type="number"
                min="10"
                max="90"
                value={localSettings.onboardingLowProgressPercent}
                onChange={(e) => handleChange('onboardingLowProgressPercent', parseInt(e.target.value) || 50)}
              />
              <p className="text-xs text-muted-foreground">
                Klienti s postupem pod tuto hranici budou označeni žlutě
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Upozornění na zaseklé klienty</Label>
              <p className="text-sm text-muted-foreground">
                Zobrazovat upozornění na klienty bez aktivity
              </p>
            </div>
            <Switch
              checked={localSettings.onboardingShowStalled}
              onCheckedChange={(checked) => handleChange('onboardingShowStalled', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email při zaseknutí klienta</Label>
              <p className="text-sm text-muted-foreground">
                Posílat emailové upozornění když klient dosáhne limitu dní bez aktivity
              </p>
            </div>
            <Switch
              checked={localSettings.onboardingEmailOnStalled}
              onCheckedChange={(checked) => handleChange('onboardingEmailOnStalled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Výchozí nastavení */}
      <Card>
        <CardHeader>
          <CardTitle>Výchozí nastavení</CardTitle>
          <CardDescription>
            Nastavte výchozí hodnoty pro nové klienty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultVatRate">Výchozí sazba DPH (%)</Label>
              <Input
                id="defaultVatRate"
                type="number"
                min="0"
                max="100"
                value={localSettings.defaultVatRate}
                onChange={(e) => handleChange('defaultVatRate', parseInt(e.target.value) || 21)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminderDays">Počet dní před urgováním</Label>
              <Input
                id="reminderDays"
                type="number"
                min="1"
                max="30"
                value={localSettings.reminderDays}
                onChange={(e) => handleChange('reminderDays', parseInt(e.target.value) || 7)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automatizace */}
      <Card>
        <CardHeader>
          <CardTitle>Automatizace</CardTitle>
          <CardDescription>
            Automatické připomínky a upozornění
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatické připomínky klientům</Label>
              <p className="text-sm text-muted-foreground">
                Posílat klientům automatické připomínky před deadlinem
              </p>
            </div>
            <Switch
              checked={localSettings.autoReminders}
              onCheckedChange={(checked) => handleChange('autoReminders', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Automatické schvalování dokumentů</Label>
              <p className="text-sm text-muted-foreground">
                Automaticky schválit dokumenty které prošly kontrolou AI
              </p>
            </div>
            <Switch
              checked={localSettings.autoApproveAI}
              onCheckedChange={(checked) => handleChange('autoApproveAI', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Akce */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          className="text-gray-600 dark:text-gray-400"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Obnovit výchozí
        </Button>
        <Button
          onClick={handleSave}
          className=""
        >
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Uloženo
            </>
          ) : (
            'Uložit změny'
          )}
        </Button>
      </div>
    </div>
  )
}
