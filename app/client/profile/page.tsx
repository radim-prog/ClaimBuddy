'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loginName, setLoginName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/client/profile')
      .then(r => r.json())
      .then(data => {
        setName(data.name || '')
        setEmail(data.email || '')
        setLoginName(data.login_name || '')
      })
      .catch(() => toast.error('Nepodařilo se načíst profil'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profil uložen')
    } catch (err: any) {
      toast.error(err.message || 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Hesla se neshodují')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Heslo změněno')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Chyba při změně hesla')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Můj profil</h1>
        <p className="text-muted-foreground">Upravte své osobní údaje</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Osobní údaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="login">Přihlašovací jméno</Label>
            <Input id="login" value={loginName} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">Nelze změnit</p>
          </div>
          <div>
            <Label htmlFor="name">Jméno</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5" />
            Změna hesla
          </CardTitle>
          <CardDescription>Vyplňte pouze pokud chcete heslo změnit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current">Současné heslo</Label>
            <Input id="current" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new">Nové heslo</Label>
            <Input id="new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="confirm">Potvrdit nové heslo</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword} variant="outline">
            <Lock className="mr-2 h-4 w-4" />
            {saving ? 'Měním...' : 'Změnit heslo'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
