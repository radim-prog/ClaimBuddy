'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Receipt, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import type { FirmBillingSettings, FirmDunningSettings } from '@/lib/types/tenant'

const DEFAULT_BILLING: Required<FirmBillingSettings> = {
  billing_day: 1,
  payment_due_days: 14,
  penalty_rate: 0.0005,
  currency: 'CZK',
}

const DEFAULT_DUNNING: Required<FirmDunningSettings> = {
  enabled: true,
  levels: [
    { days_overdue: 7, channels: ['email', 'in_app'] },
    { days_overdue: 14, channels: ['email', 'in_app'] },
    { days_overdue: 30, channels: ['email', 'in_app'] },
  ],
}

export function OperationsBillingSettings() {
  const { firmId } = useAccountantUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [billing, setBilling] = useState<Required<FirmBillingSettings>>(DEFAULT_BILLING)
  const [dunning, setDunning] = useState<Required<FirmDunningSettings>>(DEFAULT_DUNNING)

  useEffect(() => {
    if (!firmId) { setLoading(false); return }
    fetch(`/api/accountant/admin/tenants/${firmId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.firm?.settings) {
          setBilling({ ...DEFAULT_BILLING, ...data.firm.settings.billing })
          setDunning({ ...DEFAULT_DUNNING, ...data.firm.settings.dunning })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [firmId])

  const handleSave = async () => {
    if (!firmId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/accountant/admin/tenants/${firmId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { billing, dunning },
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Nastavení uloženo')
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const updateDunningLevel = (index: number, field: string, value: number | string[]) => {
    setDunning(prev => ({
      ...prev,
      levels: prev.levels.map((lvl, i) =>
        i === index ? { ...lvl, [field]: value } : lvl
      ),
    }))
  }

  const toggleChannel = (levelIndex: number, channel: string) => {
    setDunning(prev => ({
      ...prev,
      levels: prev.levels.map((lvl, i) => {
        if (i !== levelIndex) return lvl
        const channels = lvl.channels.includes(channel)
          ? lvl.channels.filter(c => c !== channel)
          : [...lvl.channels, channel]
        return { ...lvl, channels }
      }),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!firmId) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        Firma není přiřazena k vašemu účtu.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Billing Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-blue-600" />
            Fakturace
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admin_billing_day" className="text-xs text-gray-500">Den fakturace (1-28)</Label>
              <Input
                id="admin_billing_day"
                type="number"
                min={1}
                max={28}
                value={billing.billing_day}
                onChange={e => setBilling(prev => ({ ...prev, billing_day: Math.min(28, Math.max(1, Number(e.target.value) || 1)) }))}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin_payment_due_days" className="text-xs text-gray-500">Splatnost (dní)</Label>
              <Input
                id="admin_payment_due_days"
                type="number"
                min={1}
                max={90}
                value={billing.payment_due_days}
                onChange={e => setBilling(prev => ({ ...prev, payment_due_days: Number(e.target.value) || 14 }))}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin_penalty_rate" className="text-xs text-gray-500">Penále za den (%)</Label>
              <Input
                id="admin_penalty_rate"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={(billing.penalty_rate * 100).toFixed(2)}
                onChange={e => setBilling(prev => ({ ...prev, penalty_rate: (Number(e.target.value) || 0) / 100 }))}
                className="h-9 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin_currency" className="text-xs text-gray-500">Měna</Label>
              <Input
                id="admin_currency"
                value={billing.currency}
                onChange={e => setBilling(prev => ({ ...prev, currency: e.target.value.toUpperCase().slice(0, 3) }))}
                className="h-9 mt-1"
                maxLength={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dunning Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-orange-600" />
              Upomínky
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="admin_dunning_enabled" className="text-xs text-gray-500">Aktivní</Label>
              <Switch
                id="admin_dunning_enabled"
                checked={dunning.enabled}
                onCheckedChange={v => setDunning(prev => ({ ...prev, enabled: v }))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!dunning.enabled ? (
            <p className="text-sm text-gray-400 text-center py-4">Upomínky jsou vypnuté</p>
          ) : (
            <div className="space-y-3">
              {dunning.levels.map((level, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Label className="text-xs text-gray-500 whitespace-nowrap">Po</Label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={level.days_overdue}
                      onChange={e => updateDunningLevel(i, 'days_overdue', Number(e.target.value) || 7)}
                      className="h-8 w-16 text-sm"
                    />
                    <Label className="text-xs text-gray-500 whitespace-nowrap">dnech</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {['email', 'in_app'].map(channel => (
                      <Badge
                        key={channel}
                        variant={level.channels.includes(channel) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleChannel(i, channel)}
                      >
                        {channel === 'email' ? 'E-mail' : 'In-app'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Uložit nastavení
        </Button>
      </div>
    </div>
  )
}
