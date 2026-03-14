'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useSettings, AlertSettings } from '@/lib/contexts/settings-context'
import { Check, RotateCcw, Calendar, Banknote } from 'lucide-react'
import { toast } from 'sonner'

function InlineField({ label, id, children, className }: { label: string; id?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <Label htmlFor={id} className="text-xs text-gray-500 whitespace-nowrap shrink-0">{label}</Label>
      {children}
    </div>
  )
}

function CompactInput({ id, value, onChange, min, max, step, unit, width }: {
  id: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number | string; unit?: string; width?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={`h-8 text-sm ${width || 'w-20'}`}
      />
      {unit && <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>}
    </div>
  )
}

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
      if (res.ok) toast.success('Sazby uloženy')
      else toast.error('Chyba při ukládání')
    } catch { toast.error('Chyba při ukládání') }
    finally { setRatesSaving(false) }
  }

  const handleDeadlineDaySave = async () => {
    setDeadlineSaving(true)
    try {
      const res = await fetch('/api/accountant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline_day: deadlineDay }),
      })
      if (res.ok) toast.success('Deadline den uložen')
      else toast.error('Chyba při ukládání')
    } catch { toast.error('Chyba při ukládání') }
    finally { setDeadlineSaving(false) }
  }

  useEffect(() => {
    if (isLoaded) setLocalSettings(settings)
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
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Deadline a sazby
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <InlineField label="Deadline podkladů" id="deadlineDay">
              <CompactInput id="deadlineDay" value={deadlineDay} onChange={(v) => setDeadlineDay(Math.min(28, Math.max(1, v)))} min={1} max={28} unit="den v měsíci" />
            </InlineField>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleDeadlineDaySave} disabled={deadlineSaving}>
              {deadlineSaving ? '...' : 'Uložit'}
            </Button>
          </div>
          <div className="border-t pt-3 flex items-center gap-4 flex-wrap">
            <InlineField label="Práce" id="hourlyRate">
              <CompactInput id="hourlyRate" value={hourlyRate} onChange={setHourlyRate} min={0} step={50} unit="Kč/hod" />
            </InlineField>
            <InlineField label="Cesta" id="wastedTimeRate">
              <CompactInput id="wastedTimeRate" value={wastedTimeRate} onChange={setWastedTimeRate} min={0} step={50} unit="Kč/hod" />
            </InlineField>
            <InlineField label="Kilometry" id="kmRate">
              <CompactInput id="kmRate" value={kmRate} onChange={setKmRate} min={0} step={0.5} unit="Kč/km" />
            </InlineField>
            <Button size="sm" variant="outline" className="h-8 text-xs ml-auto" onClick={handleRatesSave} disabled={ratesSaving}>
              {ratesSaving ? '...' : 'Uložit sazby'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifikace */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Notifikace</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Email notifikace</Label>
              <span className="text-xs text-muted-foreground">— nové dokumenty</span>
            </div>
            <Switch checked={localSettings.emailNotifications} onCheckedChange={(checked) => handleChange('emailNotifications', checked)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">SMS notifikace</Label>
              <span className="text-xs text-muted-foreground">— urgentní záležitosti</span>
            </div>
            <Switch checked={localSettings.smsNotifications} onCheckedChange={(checked) => handleChange('smsNotifications', checked)} />
          </div>
        </CardContent>
      </Card>

      {/* Prahy upozornění */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Prahy upozornění</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-16 shrink-0">Doklady</span>
            <InlineField label="Kritický" id="documentCriticalDays">
              <CompactInput id="documentCriticalDays" value={localSettings.documentCriticalDays} onChange={(v) => handleChange('documentCriticalDays', v)} min={0} max={30} unit="dní" />
            </InlineField>
            <InlineField label="Urgentní" id="documentUrgentDays">
              <CompactInput id="documentUrgentDays" value={localSettings.documentUrgentDays} onChange={(v) => handleChange('documentUrgentDays', v)} min={0} max={30} unit="dní" />
            </InlineField>
            <InlineField label="Deadline uzávěrky" id="closureDeadlineDay">
              <CompactInput id="closureDeadlineDay" value={localSettings.closureDeadlineDay} onChange={(v) => handleChange('closureDeadlineDay', v)} min={1} max={28} unit="den" />
            </InlineField>
          </div>
          <div className="border-t pt-3 flex items-center gap-4 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-16 shrink-0">Úkoly</span>
            <InlineField label="Kritický" id="taskOverdueCriticalDays">
              <CompactInput id="taskOverdueCriticalDays" value={localSettings.taskOverdueCriticalDays} onChange={(v) => handleChange('taskOverdueCriticalDays', v)} min={0} max={30} unit="dní po termínu" />
            </InlineField>
            <InlineField label="Urgentní" id="taskOverdueUrgentDays">
              <CompactInput id="taskOverdueUrgentDays" value={localSettings.taskOverdueUrgentDays} onChange={(v) => handleChange('taskOverdueUrgentDays', v)} min={0} max={30} unit="dní před" />
            </InlineField>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Onboarding klientů</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <InlineField label="Bez aktivity = zaseklý" id="onboardingStalledDays">
              <CompactInput id="onboardingStalledDays" value={localSettings.onboardingStalledDays} onChange={(v) => handleChange('onboardingStalledDays', v)} min={1} max={60} unit="dní" />
            </InlineField>
            <InlineField label="Práh nízkého postupu" id="onboardingLowProgressPercent">
              <CompactInput id="onboardingLowProgressPercent" value={localSettings.onboardingLowProgressPercent} onChange={(v) => handleChange('onboardingLowProgressPercent', v)} min={10} max={90} unit="%" />
            </InlineField>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm">Upozornění na zaseklé klienty</Label>
            <Switch checked={localSettings.onboardingShowStalled} onCheckedChange={(checked) => handleChange('onboardingShowStalled', checked)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm">Email při zaseknutí klienta</Label>
            <Switch checked={localSettings.onboardingEmailOnStalled} onCheckedChange={(checked) => handleChange('onboardingEmailOnStalled', checked)} />
          </div>
        </CardContent>
      </Card>

      {/* Výchozí + Automatizace */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display">Výchozí nastavení a automatizace</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-4 flex-wrap">
            <InlineField label="Výchozí DPH" id="defaultVatRate">
              <CompactInput id="defaultVatRate" value={localSettings.defaultVatRate} onChange={(v) => handleChange('defaultVatRate', v)} min={0} max={100} unit="%" />
            </InlineField>
            <InlineField label="Dní před urgováním" id="reminderDays">
              <CompactInput id="reminderDays" value={localSettings.reminderDays} onChange={(v) => handleChange('reminderDays', v)} min={1} max={30} unit="dní" />
            </InlineField>
          </div>
          <div className="border-t pt-2 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Auto připomínky klientům</Label>
                <span className="text-xs text-muted-foreground">— před deadlinem</span>
              </div>
              <Switch checked={localSettings.autoReminders} onCheckedChange={(checked) => handleChange('autoReminders', checked)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Auto schvalování AI</Label>
                <span className="text-xs text-muted-foreground">— po kontrole AI</span>
              </div>
              <Switch checked={localSettings.autoApproveAI} onCheckedChange={(checked) => handleChange('autoApproveAI', checked)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Akce */}
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-gray-600 dark:text-gray-400 h-8 text-xs">
          <RotateCcw className="mr-1.5 h-3 w-3" />
          Obnovit výchozí
        </Button>
        <Button size="sm" onClick={handleSave} className="h-8 text-xs">
          {saved ? <><Check className="mr-1.5 h-3 w-3" />Uloženo</> : 'Uložit změny'}
        </Button>
      </div>
    </div>
  )
}
