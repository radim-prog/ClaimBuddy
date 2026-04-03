'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

export default function AccountantProfilePage() {
  const { userId, userInitials } = useAccountantUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [ic, setIc] = useState('')
  const [address, setAddress] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetch('/api/accountant/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setName(data.name || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
          setIc(data.ic || '')
          setAddress(data.address || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, ic, address }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Chyba při ukládání')
      }
      toast.success('Profil uložen')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Zadejte současné heslo')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Nové heslo musí mít alespoň 6 znaků')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Hesla se neshodují')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/accountant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Chyba při změně hesla')
      }
      toast.success('Heslo změněno')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Chyba při změně hesla')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Profil</h1>
        <p className="text-muted-foreground">
          Spravujte své osobní údaje
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        {/* Avatar */}
        <Card className="rounded-xl shadow-soft">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-3xl">
                {userInitials || '..'}
              </AvatarFallback>
            </Avatar>
          </CardContent>
        </Card>

        {/* Osobni udaje */}
        <Card className="rounded-xl shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Osobní údaje</CardTitle>
            <CardDescription>
              Aktualizujte své kontaktní informace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno a příjmení</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+420 ..." className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ic">IČ (jako OSVČ)</Label>
                <Input id="ic" value={ic} onChange={e => setIc(e.target.value)} placeholder="12345678" className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresa</Label>
              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ulice, Město, PSČ" className="h-11" />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Uložit údaje
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zmena hesla */}
      <Card className="rounded-xl shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Změna hesla</CardTitle>
          <CardDescription>
            Aktualizujte své přihlašovací heslo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Současné heslo</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-11" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrdit heslo</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword} variant="outline" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Změnit heslo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
