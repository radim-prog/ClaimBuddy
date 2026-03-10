'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Shield,
  Briefcase,
  Calculator,
  User,
  Edit2,
  Check,
} from 'lucide-react'
import {
  TeamMember,
  UserRole,
} from '@/lib/types/admin'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrátor',
  manager: 'Manažer',
  accountant: 'Účetní',
  client: 'Klient',
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-300',
  manager: 'bg-blue-100 text-blue-700 border-blue-300',
  accountant: 'bg-green-100 text-green-700 border-green-300',
  client: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300',
}

const roleIcons: Record<UserRole, typeof Shield> = {
  admin: Shield,
  manager: Briefcase,
  accountant: Calculator,
  client: User,
}

interface OrgNodeProps {
  member: TeamMember
  members: TeamMember[]
  level: number
  onEdit: (member: TeamMember) => void
}

function OrgNode({ member, members, level, onEdit }: OrgNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const subordinates = members.filter((m) => m.supervisor_id === member.id)
  const hasSubordinates = subordinates.length > 0
  const RoleIcon = roleIcons[member.role]

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
      <div
        className={`
          flex items-center gap-3 p-3 rounded-xl border-2 mb-2 transition-all
          ${roleColors[member.role]}
          hover:shadow-soft-md cursor-pointer
        `}
        onClick={() => onEdit(member)}
      >
        {hasSubordinates && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-1 hover:bg-white dark:bg-gray-800/50 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasSubordinates && <div className="w-6" />}

        <div className="p-2 bg-white dark:bg-gray-800/50 rounded-lg">
          <RoleIcon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{member.name}</span>
            {!member.is_active && (
              <Badge variant="secondary" className="text-xs rounded-md">
                Neaktivní
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span>{roleLabels[member.role]}</span>
            <span>•</span>
            <span className="truncate">{member.email}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(member)
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {isExpanded && hasSubordinates && (
        <div className="space-y-1">
          {subordinates.map((sub) => (
            <OrgNode
              key={sub.id}
              member={sub}
              members={members}
              level={level + 1}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PeopleHierarchy() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch('/api/accountant/admin/team')
      .then((r) => r.json())
      .then((teamData) => {
        setMembers(teamData.members || [])
      })
      .catch((err) => console.error('Error loading hierarchy data:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'accountant' as UserRole,
    supervisor_id: '',
  })

  // Get root members (no supervisor)
  const rootMembers = useMemo(() => {
    return members.filter((m) => !m.supervisor_id)
  }, [members])

  const handleAddMember = () => {
    // Note: Team members are managed through /accountant/settings/users
    // This adds them to the local view for hierarchy display
    const member: TeamMember = {
      id: crypto.randomUUID(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      supervisor_id: newMember.supervisor_id || undefined,
      supervisors: newMember.supervisor_id ? [newMember.supervisor_id] : undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setMembers([...members, member])
    setNewMember({ name: '', email: '', role: 'accountant', supervisor_id: '' })
    setIsAddMemberOpen(false)
  }

  const handleToggleMemberActive = () => {
    if (!editingMember) return
    setMembers(
      members.map((m) =>
        m.id === editingMember.id ? { ...m, is_active: !m.is_active } : m
      )
    )
    setEditingMember({ ...editingMember, is_active: !editingMember.is_active })
  }

  return (
    <div className="space-y-6">
      {/* Add Member Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAddMemberOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Přidat člena
        </Button>
      </div>

      {/* Org Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Users className="h-5 w-5" />
            Organizační struktura
          </CardTitle>
          <CardDescription>
            Klikněte na člena pro úpravy. Přetáhněte pro změnu struktury.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rootMembers.map((member) => (
              <OrgNode
                key={member.id}
                member={member}
                members={members}
                level={0}
                onEdit={setEditingMember}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-4">
            {Object.entries(roleLabels).map(([role, label]) => {
              const Icon = roleIcons[role as UserRole]
              return (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <div
                    className={`p-1.5 rounded ${
                      roleColors[role as UserRole]
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">{label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Přidat člena týmu</DialogTitle>
            <DialogDescription>
              Vytvořte nového člena organizační struktury
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Jméno</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                placeholder="Jan Novák"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
                placeholder="jan@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(v) =>
                  setNewMember({ ...newMember, role: v as UserRole })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrátor</SelectItem>
                  <SelectItem value="manager">Manažer</SelectItem>
                  <SelectItem value="accountant">Účetní</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nadřízený</Label>
              <Select
                value={newMember.supervisor_id}
                onValueChange={(v) =>
                  setNewMember({ ...newMember, supervisor_id: v })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Vyberte nadřízeného" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Žádný (root)</SelectItem>
                  {members
                    .filter((m) => m.role !== 'accountant')
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({roleLabels[m.role]})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!newMember.name || !newMember.email}
            >
              <Check className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Upravit člena týmu</DialogTitle>
            <DialogDescription>
              {editingMember?.name} - {editingMember && roleLabels[editingMember.role]}
            </DialogDescription>
          </DialogHeader>
          {editingMember && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div>
                  <p className="font-medium">{editingMember.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{editingMember.email}</p>
                </div>
                <Badge className={`rounded-md ${roleColors[editingMember.role]}`}>
                  {roleLabels[editingMember.role]}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Nadřízený</Label>
                <Select
                  value={editingMember.supervisor_id || ''}
                  onValueChange={(v) => {
                    setMembers(
                      members.map((m) =>
                        m.id === editingMember.id
                          ? { ...m, supervisor_id: v || undefined }
                          : m
                      )
                    )
                    setEditingMember({
                      ...editingMember,
                      supervisor_id: v || undefined,
                    })
                  }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Žádný" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Žádný (root)</SelectItem>
                    {members
                      .filter(
                        (m) =>
                          m.id !== editingMember.id &&
                          m.role !== 'accountant'
                      )
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({roleLabels[m.role]})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl">
                <div>
                  <p className="font-medium">Stav účtu</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {editingMember.is_active
                      ? 'Účet je aktivní'
                      : 'Účet je deaktivovaný'}
                  </p>
                </div>
                <Button
                  variant={editingMember.is_active ? 'destructive' : 'default'}
                  size="sm"
                  onClick={handleToggleMemberActive}
                >
                  {editingMember.is_active ? 'Deaktivovat' : 'Aktivovat'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditingMember(null)}>Zavřít</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
