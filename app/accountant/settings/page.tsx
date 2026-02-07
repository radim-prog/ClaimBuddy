'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useSettings, AlertSettings } from '@/lib/contexts/settings-context'
import { Check, RotateCcw } from 'lucide-react'

export default function AccountantSettingsPage() {
  const { settings, updateSettings, resetSettings, isLoaded } = useSettings()
  const [localSettings, setLocalSettings] = useState<AlertSettings>(settings)
  const [saved, setSaved] = useState(false)

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
          className="bg-blue-600 hover:bg-blue-700 text-white"
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
