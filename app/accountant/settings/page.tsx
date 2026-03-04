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
    <div className="space-y-4">
      {/* Deadline + Sazby */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Deadline a sazby
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1 max-w-[200px]">
              <Label htmlFor="deadlineDay" className="text-xs">Deadline podkladů (den v měsíci)</Label>
              <Input
                id="deadlineDay"
                type="number"
                min="1"
                max="28"
                value={deadlineDay}
                onChange={(e) => setDeadlineDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                className="h-11"
              />
            </div>
            <Button size="sm" onClick={handleDeadlineDaySave} disabled={deadlineSaving}>
              {deadlineSaving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </div>
          <div className="border-t pt-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hourlyRate" className="text-xs">Kč/hod</Label>
                <Input id="hourlyRate" type="number" min="0" step="50" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value) || 0)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kmRate" className="text-xs">Kč/km</Label>
                <Input id="kmRate" type="number" min="0" step="0.5" value={kmRate} onChange={(e) => setKmRate(Number(e.target.value) || 0)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wastedTimeRate" className="text-xs">Kč/hod cesta</Label>
                <Input id="wastedTimeRate" type="number" min="0" step="50" value={wastedTimeRate} onChange={(e) => setWastedTimeRate(Number(e.target.value) || 0)} className="h-11" />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <Button size="sm" onClick={handleRatesSave} disabled={ratesSaving}>
                {ratesSaving ? 'Ukládám...' : 'Uložit sazby'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifikace */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Notifikace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Email notifikace</Label>
              <p className="text-xs text-muted-foreground">Upozornění o nových dokumentech</p>
            </div>
            <Switch
              checked={localSettings.emailNotifications}
              onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">SMS notifikace</Label>
              <p className="text-xs text-muted-foreground">SMS o urgentních záležitostech</p>
            </div>
            <Switch
              checked={localSettings.smsNotifications}
              onCheckedChange={(checked) => handleChange('smsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Prahy upozornění */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Prahy upozornění</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dokumenty</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="documentCriticalDays" className="text-xs">Kritický (dní)</Label>
              <Input id="documentCriticalDays" type="number" min="0" max="30" value={localSettings.documentCriticalDays} onChange={(e) => handleChange('documentCriticalDays', parseInt(e.target.value) || 0)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documentUrgentDays" className="text-xs">Urgentní (dní)</Label>
              <Input id="documentUrgentDays" type="number" min="0" max="30" value={localSettings.documentUrgentDays} onChange={(e) => handleChange('documentUrgentDays', parseInt(e.target.value) || 0)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closureDeadlineDay" className="text-xs">Deadline uzávěrky (den)</Label>
              <Input id="closureDeadlineDay" type="number" min="1" max="28" value={localSettings.closureDeadlineDay} onChange={(e) => handleChange('closureDeadlineDay', parseInt(e.target.value) || 10)} className="h-11" />
            </div>
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Úkoly</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="taskOverdueCriticalDays" className="text-xs">Kritický (dní po termínu)</Label>
                <Input id="taskOverdueCriticalDays" type="number" min="0" max="30" value={localSettings.taskOverdueCriticalDays} onChange={(e) => handleChange('taskOverdueCriticalDays', parseInt(e.target.value) || 0)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taskOverdueUrgentDays" className="text-xs">Urgentní (dní před termínem)</Label>
                <Input id="taskOverdueUrgentDays" type="number" min="0" max="30" value={localSettings.taskOverdueUrgentDays} onChange={(e) => handleChange('taskOverdueUrgentDays', parseInt(e.target.value) || 0)} className="h-11" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Onboarding klientů</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="onboardingStalledDays" className="text-xs">Dní bez aktivity = zaseklý</Label>
              <Input id="onboardingStalledDays" type="number" min="1" max="60" value={localSettings.onboardingStalledDays} onChange={(e) => handleChange('onboardingStalledDays', parseInt(e.target.value) || 7)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboardingLowProgressPercent" className="text-xs">Práh nízkého postupu (%)</Label>
              <Input id="onboardingLowProgressPercent" type="number" min="10" max="90" value={localSettings.onboardingLowProgressPercent} onChange={(e) => handleChange('onboardingLowProgressPercent', parseInt(e.target.value) || 50)} className="h-11" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Upozornění na zaseklé klienty</Label>
            <Switch checked={localSettings.onboardingShowStalled} onCheckedChange={(checked) => handleChange('onboardingShowStalled', checked)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Email při zaseknutí klienta</Label>
            <Switch checked={localSettings.onboardingEmailOnStalled} onCheckedChange={(checked) => handleChange('onboardingEmailOnStalled', checked)} />
          </div>
        </CardContent>
      </Card>

      {/* Výchozí + Automatizace */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Výchozí nastavení a automatizace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultVatRate" className="text-xs">Výchozí DPH (%)</Label>
              <Input id="defaultVatRate" type="number" min="0" max="100" value={localSettings.defaultVatRate} onChange={(e) => handleChange('defaultVatRate', parseInt(e.target.value) || 21)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reminderDays" className="text-xs">Dní před urgováním</Label>
              <Input id="reminderDays" type="number" min="1" max="30" value={localSettings.reminderDays} onChange={(e) => handleChange('reminderDays', parseInt(e.target.value) || 7)} className="h-11" />
            </div>
          </div>
          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Automatické připomínky klientům</Label>
                <p className="text-xs text-muted-foreground">Před deadlinem</p>
              </div>
              <Switch checked={localSettings.autoReminders} onCheckedChange={(checked) => handleChange('autoReminders', checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Automatické schvalování AI</Label>
                <p className="text-xs text-muted-foreground">Dokumenty po kontrole AI</p>
              </div>
              <Switch checked={localSettings.autoApproveAI} onCheckedChange={(checked) => handleChange('autoApproveAI', checked)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Akce */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-gray-600 dark:text-gray-400">
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Obnovit výchozí
        </Button>
        <Button size="sm" onClick={handleSave}>
          {saved ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
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
