'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { UserCapacity, CapacityOverride } from '@/lib/types/project'

interface UserScheduleEditorProps {
  capacity: UserCapacity
  onUpdated: () => void
}

const DAYS = [
  { key: 'mon', label: 'Po' },
  { key: 'tue', label: 'Út' },
  { key: 'wed', label: 'St' },
  { key: 'thu', label: 'Čt' },
  { key: 'fri', label: 'Pá' },
  { key: 'sat', label: 'So' },
  { key: 'sun', label: 'Ne' },
]

const REASON_OPTIONS = [
  { value: 'vacation', label: 'Dovolená' },
  { value: 'sick_leave', label: 'Nemocenská' },
  { value: 'part_time', label: 'Částečný úvazek' },
  { value: 'training', label: 'Školení' },
]

export function UserScheduleEditor({ capacity, onUpdated }: UserScheduleEditorProps) {
  const [weeklyHours, setWeeklyHours] = useState(capacity.weekly_hours_capacity)
  const [schedule, setSchedule] = useState(capacity.work_schedule)
  const [saving, setSaving] = useState(false)
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [newOverride, setNewOverride] = useState({
    date_from: '',
    date_to: '',
    daily_hours: 0,
    reason: 'vacation',
  })

  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/capacity/my', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekly_hours_capacity: weeklyHours, work_schedule: schedule }),
      })
      if (res.ok) {
        toast.success('Kapacita uložena')
        onUpdated()
      }
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleAddOverride = async () => {
    if (!newOverride.date_from || !newOverride.date_to) return
    try {
      const res = await fetch('/api/accountant/capacity/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: capacity.user_id,
          ...newOverride,
        }),
      })
      if (res.ok) {
        toast.success('Výjimka přidána')
        setOverrideDialogOpen(false)
        setNewOverride({ date_from: '', date_to: '', daily_hours: 0, reason: 'vacation' })
        onUpdated()
      }
    } catch {
      toast.error('Chyba při ukládání')
    }
  }

  const handleDeleteOverride = async (id: string) => {
    try {
      await fetch(`/api/accountant/capacity/overrides?id=${id}`, { method: 'DELETE' })
      toast.success('Výjimka smazána')
      onUpdated()
    } catch {
      toast.error('Chyba')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{capacity.user_name} — Kapacita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Týdenní úvazek (hodiny)</Label>
            <Input
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="w-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Denní rozvrh</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map(day => (
                <div key={day.key} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day.label}</div>
                  <Input
                    type="number"
                    value={schedule[day.key] || 0}
                    onChange={(e) => setSchedule(prev => ({ ...prev, [day.key]: Number(e.target.value) }))}
                    className="text-center h-8 text-sm"
                    min={0}
                    max={24}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveSchedule} disabled={saving} size="sm">
            {saving ? 'Ukládání...' : 'Uložit kapacitu'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Výjimky (dovolené, nemocenské)
            </span>
            <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Přidat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nová výjimka</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Od</Label>
                      <Input
                        type="date"
                        value={newOverride.date_from}
                        onChange={(e) => setNewOverride(p => ({ ...p, date_from: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Do</Label>
                      <Input
                        type="date"
                        value={newOverride.date_to}
                        onChange={(e) => setNewOverride(p => ({ ...p, date_to: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Pracovní hodiny/den v tomto období</Label>
                    <Input
                      type="number"
                      value={newOverride.daily_hours}
                      onChange={(e) => setNewOverride(p => ({ ...p, daily_hours: Number(e.target.value) }))}
                      min={0}
                      max={24}
                    />
                    <p className="text-xs text-muted-foreground">0 = celý den volno</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Důvod</Label>
                    <Select value={newOverride.reason} onValueChange={(v) => setNewOverride(p => ({ ...p, reason: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REASON_OPTIONS.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddOverride} disabled={!newOverride.date_from || !newOverride.date_to}>
                    Přidat výjimku
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {capacity.overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Žádné plánované výjimky</p>
          ) : (
            <div className="space-y-2">
              {capacity.overrides.map(override => (
                <div key={override.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div>
                    <span className="font-medium">
                      {new Date(override.date_from).toLocaleDateString('cs-CZ')} — {new Date(override.date_to).toLocaleDateString('cs-CZ')}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {REASON_OPTIONS.find(r => r.value === override.reason)?.label || override.reason}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{override.daily_hours}h/den</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteOverride(override.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
