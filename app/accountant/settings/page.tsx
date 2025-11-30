'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DollarSign, Settings as SettingsIcon, Users as UsersIcon, Trash2, Key } from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

type User = {
  id: string
  name: string
  email: string
  role: 'client' | 'accountant' | 'admin'
  created_at: string
  last_login_at: string | null
}

export default function AccountantSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'users'>('general')
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<'client' | 'accountant' | 'admin'>('client')

  // Reset password dialog
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [resetPasswordUserName, setResetPasswordUserName] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Delete user dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (activeTab === 'users' && currentUserRole === 'admin') {
      fetchUsers()
    }
  }, [activeTab, currentUserRole])

  const fetchCurrentUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single()
      setCurrentUserRole(data?.role || null)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()

      if (res.ok) {
        setUsers(data.users)
      } else {
        toast.error('Chyba', { description: data.error })
      }
    } catch (error) {
      toast.error('Chyba', { description: 'Nepodařilo se načíst uživatele' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserName || !newUserPassword) {
      toast.error('Chyba', { description: 'Vyplňte všechna pole' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          password: newUserPassword,
          role: newUserRole
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Úspěch', { description: `Uživatel ${newUserName} byl vytvořen` })
        setCreateDialogOpen(false)
        setNewUserName('')
        setNewUserPassword('')
        setNewUserRole('client')
        fetchUsers()
      } else {
        toast.error('Chyba', { description: data.error })
      }
    } catch (error) {
      toast.error('Chyba', { description: 'Nepodařilo se vytvořit uživatele' })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !resetPasswordUserId) {
      toast.error('Chyba', { description: 'Zadejte nové heslo' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUserId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Úspěch', { description: data.message })
        setResetPasswordDialogOpen(false)
        setResetPasswordUserId(null)
        setResetPasswordUserName('')
        setNewPassword('')
      } else {
        toast.error('Chyba', { description: data.error })
      }
    } catch (error) {
      toast.error('Chyba', { description: 'Nepodařilo se změnit heslo' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Úspěch', { description: data.message })
        setDeleteDialogOpen(false)
        setDeleteUserId(null)
        setDeleteUserName('')
        fetchUsers()
      } else {
        toast.error('Chyba', { description: data.error })
      }
    } catch (error) {
      toast.error('Chyba', { description: 'Nepodařilo se smazat uživatele' })
    } finally {
      setLoading(false)
    }
  }

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    accountant: 'bg-blue-100 text-blue-800',
    client: 'bg-green-100 text-green-800'
  }

  const roleLabels = {
    admin: 'Admin',
    accountant: 'Účetní',
    client: 'Klient'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground">
          Spravujte své předvolby a nastavení účtu
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Obecné nastavení
          </div>
        </button>
        <Link
          href="/accountant/settings/pricing"
          className="px-4 py-2 font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Ceník a Sazby
          </div>
        </Link>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Správa uživatelů
            </div>
          </button>
        )}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS notifikace</Label>
                  <p className="text-sm text-muted-foreground">
                    Dostávejte SMS upozornění o urgentních záležitostech
                  </p>
                </div>
                <Switch />
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
              <div className="space-y-2">
                <Label htmlFor="default-vat">Výchozí sazba DPH (%)</Label>
                <Input id="default-vat" type="number" defaultValue="21" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Počet dní před urgováním</Label>
                <Input id="reminder-days" type="number" defaultValue="7" />
              </div>
            </CardContent>
          </Card>

          {/* Uložit změny */}
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Uložit změny</Button>
          </div>
        </div>
      )}

      {/* Users Management Tab - Only for Admin */}
      {activeTab === 'users' && currentUserRole === 'admin' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Správa uživatelů</CardTitle>
                  <CardDescription>
                    Vytvářejte a spravujte uživatelské účty
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Přidat uživatele
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Načítání...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jméno</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vytvořen</TableHead>
                      <TableHead>Poslední přihlášení</TableHead>
                      <TableHead className="text-right">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString('cs-CZ')
                            : 'Nikdy'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setResetPasswordUserId(user.id)
                                setResetPasswordUserName(user.name)
                                setResetPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="h-4 w-4 mr-1" />
                              Změnit heslo
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeleteUserId(user.id)
                                setDeleteUserName(user.name)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vytvořit nového uživatele</DialogTitle>
            <DialogDescription>
              Zadejte údaje nového uživatele
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Jméno</Label>
              <Input
                id="name"
                placeholder="Karel"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Klient</SelectItem>
                  <SelectItem value="accountant">Účetní</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Vytvářím...' : 'Vytvořit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Změnit heslo</DialogTitle>
            <DialogDescription>
              Změnit heslo pro uživatele: <strong>{resetPasswordUserName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nové heslo</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialogOpen(false)
                setNewPassword('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Měním...' : 'Změnit heslo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat uživatele</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat uživatele <strong>{deleteUserName}</strong>?
              <br />
              Tuto akci nelze vrátit zpět.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteUserId(null)
                setDeleteUserName('')
              }}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Mažu...' : 'Smazat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
