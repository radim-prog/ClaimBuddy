'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Calendar,
  ArrowRight,
  Plus,
  Check,
  X,
} from 'lucide-react'
import {
  TeamMember,
  SubstitutionRule,
  UserRole,
} from '@/lib/types/admin'

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('cs-CZ')
}

function getSubstitutionTypeLabel(type: SubstitutionRule['type']) {
  switch (type) {
    case 'vacation':
      return 'Dovolená'
    case 'sick_leave':
      return 'Nemocenská'
    case 'permanent':
      return 'Trvalé'
    default:
      return type
  }
}

function getSubstitutionTypeBadge(type: SubstitutionRule['type']) {
  switch (type) {
    case 'vacation':
      return 'bg-blue-100 text-blue-700'
    case 'sick_leave':
      return 'bg-orange-100 text-orange-700'
    case 'permanent':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
  }
}

export function PeopleSubstitutions() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [substitutions, setSubstitutions] = useState<SubstitutionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddSubstitutionOpen, setIsAddSubstitutionOpen] = useState(false)

  const [newSubstitution, setNewSubstitution] = useState({
    user_id: '',
    substitute_id: '',
    type: 'vacation' as SubstitutionRule['type'],
    start_date: '',
    end_date: '',
  })

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/accountant/admin/team').then(r => r.json()),
      fetch('/api/accountant/admin/substitutions').then(r => r.json()),
    ])
      .then(([teamData, subsData]) => {
        setMembers(teamData.members || [])
        setSubstitutions(subsData.rules || [])
      })
      .catch(err => console.error('Error loading substitutions data:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getMemberById = (id: string) => members.find((m) => m.id === id)

  const handleAddSubstitution = async () => {
    try {
      const response = await fetch('/api/accountant/admin/substitutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newSubstitution.user_id,
          substitute_id: newSubstitution.substitute_id,
          type: newSubstitution.type,
          start_date: newSubstitution.start_date || null,
          end_date: newSubstitution.end_date || null,
        }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Error adding substitution:', err)
    }
    setNewSubstitution({
      user_id: '',
      substitute_id: '',
      type: 'vacation',
      start_date: '',
      end_date: '',
    })
    setIsAddSubstitutionOpen(false)
  }

  const handleDeleteSubstitution = async (id: string) => {
    try {
      await fetch(`/api/accountant/admin/substitutions?id=${id}`, { method: 'DELETE' })
      setSubstitutions(substitutions.filter((s) => s.id !== id))
    } catch (err) {
      console.error('Error deleting substitution:', err)
    }
  }

  return (
    <>
      {/* Substitution Rules Card */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-display">
                <Calendar className="h-5 w-5" />
                Zastupování
              </CardTitle>
              <CardDescription>
                Pravidla zástupu při nepřítomnosti
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSubstitutionOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {substitutions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                Žádná pravidla zastupování
              </p>
            ) : (
              substitutions.map((sub) => {
                const user = getMemberById(sub.user_id)
                const substitute = getMemberById(sub.substitute_id)
                return (
                  <div
                    key={sub.id}
                    className={`
                      p-3 rounded-xl border
                      ${sub.is_active ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={`rounded-md ${getSubstitutionTypeBadge(sub.type)}`}
                      >
                        {getSubstitutionTypeLabel(sub.type)}
                      </Badge>
                      <button
                        onClick={() => handleDeleteSubstitution(sub.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {user?.name || 'Neznámý'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {substitute?.name || 'Neznámý'}
                      </span>
                    </div>
                    {sub.type !== 'permanent' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sub.start_date && formatDate(sub.start_date)}
                        {sub.end_date && ` - ${formatDate(sub.end_date)}`}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Substitution Dialog */}
      <Dialog
        open={isAddSubstitutionOpen}
        onOpenChange={setIsAddSubstitutionOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Přidat zastupování</DialogTitle>
            <DialogDescription>
              Nastavte pravidlo pro zastupování při nepřítomnosti
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kdo bude zastoupen</Label>
              <Select
                value={newSubstitution.user_id}
                onValueChange={(v) =>
                  setNewSubstitution({ ...newSubstitution, user_id: v })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Vyberte osobu" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kdo zastoupí</Label>
              <Select
                value={newSubstitution.substitute_id}
                onValueChange={(v) =>
                  setNewSubstitution({ ...newSubstitution, substitute_id: v })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Vyberte zástupce" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.id !== newSubstitution.user_id)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={newSubstitution.type}
                onValueChange={(v) =>
                  setNewSubstitution({
                    ...newSubstitution,
                    type: v as SubstitutionRule['type'],
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Dovolená</SelectItem>
                  <SelectItem value="sick_leave">Nemocenská</SelectItem>
                  <SelectItem value="permanent">Trvalé zastoupení</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newSubstitution.type !== 'permanent' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Od</Label>
                  <Input
                    type="date"
                    value={newSubstitution.start_date}
                    onChange={(e) =>
                      setNewSubstitution({
                        ...newSubstitution,
                        start_date: e.target.value,
                      })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Do</Label>
                  <Input
                    type="date"
                    value={newSubstitution.end_date}
                    onChange={(e) =>
                      setNewSubstitution({
                        ...newSubstitution,
                        end_date: e.target.value,
                      })
                    }
                    className="h-11"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSubstitutionOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleAddSubstitution}
              disabled={
                !newSubstitution.user_id || !newSubstitution.substitute_id
              }
            >
              <Check className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
