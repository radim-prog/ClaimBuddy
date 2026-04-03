'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Mail,
  Calendar,
  CalendarDays,
  FileBarChart,
  CreditCard,
  BarChart3,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportSubscription {
  id?: string
  report_type: string
  frequency: 'weekly' | 'monthly'
  enabled: boolean
}

const REPORT_TYPES = [
  {
    type: 'weekly_summary',
    label: 'Týdenní přehled',
    description: 'Souhrn: měsíční příjem, neplacené faktury, uzávěrky, platby',
    icon: Calendar,
    defaultFreq: 'weekly' as const,
  },
  {
    type: 'monthly_summary',
    label: 'Měsíční přehled',
    description: 'Kompletní měsíční report s KPI a trendy',
    icon: CalendarDays,
    defaultFreq: 'monthly' as const,
  },
  {
    type: 'dph_status',
    label: 'Přehled DPH',
    description: 'Stav DPH přiznání, otevřené uzávěrky plátců',
    icon: FileBarChart,
    defaultFreq: 'monthly' as const,
  },
  {
    type: 'payment_status',
    label: 'Stav plateb',
    description: 'Neplacené faktury, dlužné částky, inkasní přehled',
    icon: CreditCard,
    defaultFreq: 'weekly' as const,
  },
]

export default function ReportSettingsPage() {
  const [subscriptions, setSubscriptions] = useState<ReportSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/accountant/report-subscriptions')
      .then(r => r.json())
      .then(data => {
        const existing = (data.subscriptions ?? []) as ReportSubscription[]
        // Merge with defaults — ensure all report types are shown
        const merged = REPORT_TYPES.map(rt => {
          const found = existing.find(s => s.report_type === rt.type)
          return found || { report_type: rt.type, frequency: rt.defaultFreq, enabled: false }
        })
        setSubscriptions(merged)
      })
      .catch(() => {
        setSubscriptions(REPORT_TYPES.map(rt => ({ report_type: rt.type, frequency: rt.defaultFreq, enabled: false })))
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleEnabled = (reportType: string) => {
    setSubscriptions(prev =>
      prev.map(s => s.report_type === reportType ? { ...s, enabled: !s.enabled } : s)
    )
  }

  const toggleFrequency = (reportType: string) => {
    setSubscriptions(prev =>
      prev.map(s =>
        s.report_type === reportType
          ? { ...s, frequency: s.frequency === 'weekly' ? 'monthly' : 'weekly' }
          : s
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/report-subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success('Nastavení reportů uloženo')
    } catch {
      toast.error('Nepodařilo se uložit nastavení')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-500" />
          Automatické reporty emailem
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Vyberte, které přehledy chcete pravidelně dostávat na email.
        </p>
      </div>

      <div className="space-y-3">
        {REPORT_TYPES.map(rt => {
          const sub = subscriptions.find(s => s.report_type === rt.type)
          const enabled = sub?.enabled ?? false
          const frequency = sub?.frequency ?? rt.defaultFreq
          const Icon = rt.icon

          return (
            <Card key={rt.type} className={`transition-colors ${enabled ? 'border-purple-200 dark:border-purple-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${enabled ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <Icon className={`h-5 w-5 ${enabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{rt.label}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rt.description}</p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => toggleEnabled(rt.type)}
                      />
                    </div>
                    {enabled && (
                      <div className="mt-3 flex items-center gap-2">
                        <Label className="text-xs text-gray-500">Frekvence:</Label>
                        <button
                          onClick={() => toggleFrequency(rt.type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            frequency === 'weekly'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {frequency === 'weekly' ? 'Týdně (pondělí)' : 'Měsíčně (1. den)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Uložit nastavení
        </Button>
        <p className="text-xs text-gray-400">
          Reporty se odesílají automaticky — týdenní v pondělí, měsíční 1. den v měsíci.
        </p>
      </div>
    </div>
  )
}
