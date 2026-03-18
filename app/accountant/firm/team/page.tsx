'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  compensation_type: string | null
  compensation_amount: number | null
  created_at: string
}

type MemberForm = {
  name: string
  email: string
  loginName: string
  role: string
  password: string
  compensationType: string
  compensationAmount: number
}

const emptyForm: MemberForm = {
  name: '',
  email: '',
  loginName: '',
  role: 'accountant',
  password: '',
  compensationType: 'monthly',
  compensationAmount: 0,
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  accountant: 'Účetní',
  assistant: 'Asistent',
}

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  accountant: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  assistant: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function FirmTeamPage() {
  const { userId } = useAccountantUser()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<MemberForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/firm/team')
      if (!res.ok) return
      const data = await res.json()
      setMembers(data.users || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadMembers() }, [loadMembers])

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.loginName || !form.password) {
      toast.error('Vyplňte všechna povinná pole')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/firm/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Chyba'); return }
      toast.success('Člen přidán')
      setShowAdd(false)
      setForm(emptyForm)
      loadMembers()
    } catch {
      toast.error('Chyba při přidávání')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingMember) return
    setSaving(true)
    try {
      const res = await fetch(`/api/accountant/firm/team/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          compensation_type: form.compensationType,
          compensation_amount: form.compensationAmount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Chyba'); return }
      toast.success('Uloženo')
      setEditingMember(null)
      loadMembers()
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Opravdu odebrat ${member.name} z firmy?`)) return
    try {
      const res = await fetch(`/api/accountant/firm/team/${member.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Chyba'); return }
      toast.success('Člen odebrán')
      loadMembers()
    } catch {
      toast.error('Chyba')
    }
  }

  const openEdit = (member: TeamMember) => {
    setForm({
      name: member.name,
      email: member.email,
      loginName: '',
      role: member.role,
      password: '',
      compensationType: member.compensation_type || 'monthly',
      compensationAmount: member.compensation_amount || 0,
    })
    setEditingMember(member)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{members.length} členů</span>
        <Button size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Přidat člena
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {members.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">Žádní členové týmu</p>
            ) : (
              members.map(member => (
                <div key={member.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300">
                      {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.name}
                        {member.id === userId && <span className="text-xs text-gray-400 ml-1">(vy)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.compensation_amount ? (
                      <span className="text-xs text-gray-400">
                        {member.compensation_amount.toLocaleString('cs-CZ')} Kč/{member.compensation_type === 'hourly' ? 'h' : 'měs'}
                      </span>
                    ) : null}
                    <Badge variant="secondary" className={roleColors[member.role] || roleColors.accountant}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                    {member.id !== userId && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(member)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleRemove(member)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat člena týmu</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Jméno *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">E-mail *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Přihlašovací jméno *</Label>
              <Input value={form.loginName} onChange={e => setForm(p => ({ ...p, loginName: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Heslo *</Label>
              <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accountant">Účetní</SelectItem>
                    <SelectItem value="assistant">Asistent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Kompenzace</Label>
                <Select value={form.compensationType} onValueChange={v => setForm(p => ({ ...p, compensationType: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Měsíční</SelectItem>
                    <SelectItem value="hourly">Hodinová</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Částka (Kč)</Label>
              <Input type="number" value={form.compensationAmount} onChange={e => setForm(p => ({ ...p, compensationAmount: Number(e.target.value) || 0 }))} className="h-9 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Zrušit</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={v => !v && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit člena</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Jméno</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-9 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accountant">Účetní</SelectItem>
                    <SelectItem value="assistant">Asistent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Kompenzace</Label>
                <Select value={form.compensationType} onValueChange={v => setForm(p => ({ ...p, compensationType: v }))}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Měsíční</SelectItem>
                    <SelectItem value="hourly">Hodinová</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Částka (Kč)</Label>
              <Input type="number" value={form.compensationAmount} onChange={e => setForm(p => ({ ...p, compensationAmount: Number(e.target.value) || 0 }))} className="h-9 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>Zrušit</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
