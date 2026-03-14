'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users as UsersIcon, UserPlus, Pencil, Trash2, Shield, User, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_GROUPS,
  ROLE_PRESETS,
  type Permission,
  type UserPermissions,
} from '@/lib/permissions'
import type { UserRole } from '@/lib/auth'

interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  login_name: string
  permissions: UserPermissions
  compensation_type: 'hourly' | 'monthly'
  compensation_amount: number
  created_at: string
  updated_at: string
}

type FormRole = UserRole

const DEFAULT_FORM = {
  name: '',
  email: '',
  loginName: '',
  role: 'accountant' as FormRole,
  password: '',
  permissions: { ...ROLE_PRESETS.accountant },
  compensationType: 'hourly' as 'hourly' | 'monthly',
  compensationAmount: 0,
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [newUser, setNewUser] = useState({ ...DEFAULT_FORM })
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    loginName: '',
    role: 'accountant' as FormRole,
    newPassword: '',
    permissions: { ...ROLE_PRESETS.accountant },
    showPasswordReset: false,
    compensationType: 'hourly' as 'hourly' | 'monthly',
    compensationAmount: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/accountant/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users)
    } catch {
      toast.error('Nepodařilo se načíst uživatele')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.loginName || !newUser.password) {
      toast.error('Vyplňte všechna povinná pole')
      return
    }
    if (newUser.password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/accountant/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          loginName: newUser.loginName,
          role: newUser.role,
          password: newUser.password,
          permissions: newUser.permissions,
          compensationType: newUser.compensationType,
          compensationAmount: newUser.compensationAmount,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create user')
      }

      setCreateDialogOpen(false)
      setNewUser({ ...DEFAULT_FORM })
      toast.success('Uživatel vytvořen')
      fetchUsers()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (user: AppUser) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      loginName: user.login_name,
      role: user.role,
      newPassword: '',
      permissions: { ...user.permissions },
      showPasswordReset: false,
      compensationType: user.compensation_type || 'hourly',
      compensationAmount: user.compensation_amount || 0,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        loginName: editForm.loginName,
        role: editForm.role,
        permissions: editForm.permissions,
        compensationType: editForm.compensationType,
        compensationAmount: editForm.compensationAmount,
      }
      if (editForm.newPassword) {
        if (editForm.newPassword.length < 6) {
          toast.error('Heslo musí mít alespoň 6 znaků')
          setSaving(false)
          return
        }
        body.newPassword = editForm.newPassword
      }

      const res = await fetch(`/api/accountant/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update user')
      }

      setEditDialogOpen(false)
      setSelectedUser(null)
      toast.success('Uživatel aktualizován')
      fetchUsers()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const res = await fetch(`/api/accountant/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete user')
      }

      setDeleteDialogOpen(false)
      setSelectedUser(null)
      toast.success('Uživatel smazán')
      fetchUsers()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleNewUserRoleChange = (role: FormRole) => {
    setNewUser({
      ...newUser,
      role,
      permissions: { ...ROLE_PRESETS[role] },
    })
  }

  const handleEditRoleChange = (role: FormRole) => {
    setEditForm({
      ...editForm,
      role,
      permissions: { ...ROLE_PRESETS[role] },
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600 text-white text-[10px] h-5 shrink-0">Admin</Badge>
      case 'accountant':
        return <Badge className="bg-purple-600 text-white text-[10px] h-5 shrink-0">Účetní</Badge>
      case 'assistant':
        return <Badge className="bg-gray-600 text-white text-[10px] h-5 shrink-0">Asistent</Badge>
      case 'client':
        return <Badge className="bg-green-600 text-white text-[10px] h-5 shrink-0">Klient</Badge>
      default:
        return <Badge className="text-[10px] h-5 shrink-0">{role}</Badge>
    }
  }

  const PermissionsEditor = ({
    permissions,
    onChange,
    disabled,
  }: {
    permissions: UserPermissions
    onChange: (p: UserPermissions) => void
    disabled?: boolean
  }) => (
    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group}>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{group}</p>
          <div className="space-y-2">
            {PERMISSION_DEFINITIONS.filter(p => p.group === group).map((perm) => (
              <div key={perm.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{perm.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</p>
                </div>
                <Switch
                  checked={permissions[perm.key]}
                  onCheckedChange={(checked) => {
                    onChange({ ...permissions, [perm.key]: checked })
                  }}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Načítám uživatele...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display">Správa uživatelů</h2>

        {/* CREATE DIALOG */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 text-xs">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Přidat uživatele
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vytvořit nového uživatele</DialogTitle>
              <DialogDescription>Přidejte nového člena týmu do systému</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Celé jméno *</Label>
                <Input
                  id="new-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Jan Novák"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-login">Přihlašovací jméno *</Label>
                <Input
                  id="new-login"
                  value={newUser.loginName}
                  onChange={(e) => setNewUser({ ...newUser, loginName: e.target.value })}
                  placeholder="jan"
                />
                <p className="text-xs text-gray-500">Používá se pro přihlášení (malá písmena)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="jan@firma.cz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Heslo *</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Minimálně 6 znaků"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={newUser.role} onValueChange={handleNewUserRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Plný přístup</SelectItem>
                    <SelectItem value="accountant">Účetní - Standardní přístup</SelectItem>
                    <SelectItem value="assistant">Asistent - Omezený přístup</SelectItem>
                    <SelectItem value="client">Klient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kompenzace</Label>
                <div className="flex gap-2">
                  <Select
                    value={newUser.compensationType}
                    onValueChange={(v: 'hourly' | 'monthly') => setNewUser({ ...newUser, compensationType: v })}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hodinová</SelectItem>
                      <SelectItem value="monthly">Měsíční</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="number"
                      value={newUser.compensationAmount || ''}
                      onChange={(e) => setNewUser({ ...newUser, compensationAmount: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="text-right"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {newUser.compensationType === 'hourly' ? 'Kč/h' : 'Kč/měs'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Oprávnění</Label>
                <PermissionsEditor
                  permissions={newUser.permissions}
                  onChange={(p) => setNewUser({ ...newUser, permissions: p })}
                  disabled={newUser.role === 'admin'}
                />
                {newUser.role === 'admin' && (
                  <p className="text-xs text-gray-500">Admin má automaticky všechna oprávnění</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Zrušit</Button>
              <Button onClick={handleCreateUser} disabled={saving} className="">
                {saving ? 'Vytvářím...' : 'Vytvořit uživatele'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* USER LIST */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-display flex items-center gap-2">
            <UsersIcon className="h-3.5 w-3.5" />
            Seznam uživatelů ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-1.5">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-medium text-sm truncate">{user.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">({user.login_name})</span>
                  {getRoleBadge(user.role)}
                  <span className="text-xs text-gray-400 truncate hidden sm:inline">{user.email}</span>
                  {user.compensation_amount > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                      {user.compensation_amount.toLocaleString('cs-CZ')} Kč{user.compensation_type === 'hourly' ? '/h' : '/měs'}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(user)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      setSelectedUser(user)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8">
                <UsersIcon className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Zatím nemáte žádné uživatele</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upravit uživatele</DialogTitle>
            <DialogDescription>Změňte informace, roli nebo oprávnění uživatele</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Celé jméno</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-login">Přihlašovací jméno</Label>
              <Input
                id="edit-login"
                value={editForm.loginName}
                onChange={(e) => setEditForm({ ...editForm, loginName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={handleEditRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Plný přístup</SelectItem>
                  <SelectItem value="accountant">Účetní - Standardní přístup</SelectItem>
                  <SelectItem value="assistant">Asistent - Omezený přístup</SelectItem>
                  <SelectItem value="client">Klient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password reset */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditForm({ ...editForm, showPasswordReset: !editForm.showPasswordReset })}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {editForm.showPasswordReset ? 'Skrýt reset hesla' : 'Resetovat heslo'}
              </Button>
              {editForm.showPasswordReset && (
                <Input
                  type="password"
                  placeholder="Nové heslo (min 6 znaků)"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Kompenzace</Label>
              <div className="flex gap-2">
                <Select
                  value={editForm.compensationType}
                  onValueChange={(v: 'hourly' | 'monthly') => setEditForm({ ...editForm, compensationType: v })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hodinová</SelectItem>
                    <SelectItem value="monthly">Měsíční</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    value={editForm.compensationAmount || ''}
                    onChange={(e) => setEditForm({ ...editForm, compensationAmount: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="text-right"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {editForm.compensationType === 'hourly' ? 'Kč/h' : 'Kč/měs'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Oprávnění</Label>
              <PermissionsEditor
                permissions={editForm.permissions}
                onChange={(p) => setEditForm({ ...editForm, permissions: p })}
                disabled={editForm.role === 'admin'}
              />
              {editForm.role === 'admin' && (
                <p className="text-xs text-gray-500">Admin má automaticky všechna oprávnění</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Zrušit</Button>
            <Button onClick={handleUpdateUser} disabled={saving} className="">
              {saving ? 'Ukládám...' : 'Uložit změny'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Smazat uživatele</DialogTitle>
            <DialogDescription>
              Opravdu chcete smazat uživatele {selectedUser?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              Tato akce je nevratná. Uživatel ztratí přístup k systému.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Zrušit</Button>
            <Button onClick={handleDeleteUser} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? 'Mažu...' : 'Smazat uživatele'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ROLE INFO */}
      <div className="flex gap-4 text-xs text-gray-500 px-1">
        <span><Shield className="h-3 w-3 inline mr-1 text-purple-600" />Admin — plný přístup</span>
        <span><User className="h-3 w-3 inline mr-1 text-purple-600" />Účetní — standardní přístup</span>
        <span><User className="h-3 w-3 inline mr-1 text-gray-500" />Asistent — jen prohlížení</span>
      </div>
    </div>
  )
}
