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
        return <Badge className="bg-purple-600 text-white"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'accountant':
        return <Badge className="bg-blue-600 text-white"><User className="h-3 w-3 mr-1" />Účetní</Badge>
      case 'assistant':
        return <Badge className="bg-gray-600 text-white"><User className="h-3 w-3 mr-1" />Asistent</Badge>
      case 'client':
        return <Badge className="bg-green-600 text-white"><User className="h-3 w-3 mr-1" />Klient</Badge>
      default:
        return <Badge>{role}</Badge>
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group}</p>
          <div className="space-y-2">
            {PERMISSION_DEFINITIONS.filter(p => p.group === group).map((perm) => (
              <div key={perm.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{perm.label}</p>
                  <p className="text-xs text-gray-500">{perm.description}</p>
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Načítám uživatele...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Správa uživatelů</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Spravujte přístup uživatelů k systému</p>
        </div>

        {/* CREATE DIALOG */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
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
              <Button onClick={handleCreateUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? 'Vytvářím...' : 'Vytvořit uživatele'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* USER LIST */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Seznam uživatelů
          </CardTitle>
          <CardDescription>
            {users.length} {users.length === 1 ? 'uživatel' : users.length < 5 ? 'uživatelé' : 'uživatelů'} v systému
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-400">login: {user.login_name}</p>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedUser(user)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600 dark:text-gray-300">Zatím nemáte žádné uživatele</p>
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
            <Button onClick={handleUpdateUser} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
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
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-sm">Informace o rolích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-purple-600" />
            <div>
              <p className="font-semibold">Admin</p>
              <p className="text-gray-700 dark:text-gray-300">Plný přístup včetně správy uživatelů a nastavení</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold">Účetní</p>
              <p className="text-gray-700 dark:text-gray-300">Standardní přístup k účetnictví a klientům</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-gray-600" />
            <div>
              <p className="font-semibold">Asistent</p>
              <p className="text-gray-700 dark:text-gray-300">Omezený přístup pouze k prohlížení</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
