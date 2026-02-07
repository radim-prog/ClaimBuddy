'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Users as UsersIcon, UserPlus, Pencil, Trash2, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'accountant' | 'assistant'
  created_at: string
}

// Mock users data for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'jana@ucetni.cz',
    full_name: 'Jana Svobodová',
    role: 'admin',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    email: 'petr@ucetni.cz',
    full_name: 'Petr Novák',
    role: 'accountant',
    created_at: '2024-02-20T14:30:00Z',
  },
  {
    id: '3',
    email: 'marie@ucetni.cz',
    full_name: 'Marie Dvořáková',
    role: 'assistant',
    created_at: '2024-03-10T09:15:00Z',
  },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'accountant' as 'admin' | 'accountant' | 'assistant',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    setUsers(MOCK_USERS)
    setLoading(false)
  }

  const handleCreateUser = async () => {
    // Mock: Add new user to local state
    const newUserData: User = {
      id: String(Date.now()),
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      created_at: new Date().toISOString(),
    }
    setUsers(prev => [newUserData, ...prev])
    setCreateDialogOpen(false)
    setNewUser({ email: '', full_name: '', role: 'accountant', password: '' })
    toast.success('Uživatel vytvořen (demo)')
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    // Mock: Update user in local state
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u))
    setEditDialogOpen(false)
    setSelectedUser(null)
    toast.success('Uživatel aktualizován (demo)')
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    // Mock: Remove user from local state
    setUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    setDeleteDialogOpen(false)
    setSelectedUser(null)
    toast.success('Uživatel smazán (demo)')
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600 text-white"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      case 'accountant':
        return <Badge className="bg-blue-600 text-white"><User className="h-3 w-3 mr-1" />Účetní</Badge>
      case 'assistant':
        return <Badge className="bg-gray-600 text-white"><User className="h-3 w-3 mr-1" />Asistent</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Přidat uživatele
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vytvořit nového uživatele</DialogTitle>
              <DialogDescription>
                Přidejte nového člena týmu do systému
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="jmeno@firma.cz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Celé jméno *</Label>
                <Input
                  id="new-name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="Jan Novák"
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
                <Label htmlFor="new-role">Role *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'accountant' | 'assistant') =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Plný přístup</SelectItem>
                    <SelectItem value="accountant">Účetní - Standardní přístup</SelectItem>
                    <SelectItem value="assistant">Asistent - Omezený přístup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Zrušit
              </Button>
              <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
                Vytvořit uživatele
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
                      <p className="font-semibold">{user.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Vytvořeno: {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upravit uživatele</DialogTitle>
                        <DialogDescription>
                          Změňte role nebo informace o uživateli
                        </DialogDescription>
                      </DialogHeader>
                      {selectedUser && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={selectedUser.email} disabled />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Email nelze měnit</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Celé jméno</Label>
                            <Input
                              id="edit-name"
                              value={selectedUser.full_name}
                              onChange={(e) =>
                                setSelectedUser({ ...selectedUser, full_name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                              value={selectedUser.role}
                              onValueChange={(value: 'admin' | 'accountant' | 'assistant') =>
                                setSelectedUser({ ...selectedUser, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin - Plný přístup</SelectItem>
                                <SelectItem value="accountant">Účetní - Standardní přístup</SelectItem>
                                <SelectItem value="assistant">Asistent - Omezený přístup</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Zrušit
                        </Button>
                        <Button onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Uložit změny
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={deleteDialogOpen && selectedUser?.id === user.id} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Smazat uživatele</DialogTitle>
                        <DialogDescription>
                          Opravdu chcete smazat uživatele {selectedUser?.full_name}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          ⚠️ Tato akce je nevratná. Uživatel ztratí přístup k systému a všechna jeho data budou odstraněna.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Zrušit
                        </Button>
                        <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
                          Smazat uživatele
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 text-gray-600 dark:text-gray-300">Zatím nemáte žádné uživatele</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Začněte přidáním prvního člena týmu</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">Informace o rolích</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-purple-600" />
            <div>
              <p className="font-semibold">Admin</p>
              <p className="text-gray-700 dark:text-gray-200">Plný přístup včetně správy uživatelů a nastavení</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold">Účetní</p>
              <p className="text-gray-700 dark:text-gray-200">Standardní přístup k účetnictví a klientům</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-gray-600 dark:text-gray-300" />
            <div>
              <p className="font-semibold">Asistent</p>
              <p className="text-gray-700 dark:text-gray-200">Omezený přístup pouze k prohlížení a základním operacím</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
