'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Building2, Home, Mail, Landmark, Shield, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Location = {
  id: string
  name: string
  icon: string | null
  is_default: boolean
  created_at: string
}

const ICON_MAP: Record<string, typeof MapPin> = {
  building: Building2,
  home: Home,
  mail: Mail,
  landmark: Landmark,
  shield: Shield,
  users: Users,
  pin: MapPin,
}

const ICON_OPTIONS = [
  { value: 'pin', label: 'Špendlík', Icon: MapPin },
  { value: 'building', label: 'Budova', Icon: Building2 },
  { value: 'home', label: 'Dům', Icon: Home },
  { value: 'mail', label: 'Pošta', Icon: Mail },
  { value: 'landmark', label: 'Úřad', Icon: Landmark },
  { value: 'users', label: 'Lidé', Icon: Users },
]

export default function LocationsSettingsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('pin')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => {
        setLocations(data.locations || [])
        setLoading(false)
      })
      .catch(() => {
        toast.error('Nepodařilo se načíst místa')
        setLoading(false)
      })
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLocations(prev => [...prev, data.location])
      setNewName('')
      setNewIcon('pin')
      toast.success('Místo přidáno')
    } catch {
      toast.error('Chyba při přidávání místa')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Smazat místo "${name}"?`)) return
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLocations(prev => prev.filter(l => l.id !== id))
      toast.success('Místo smazáno')
    } catch {
      toast.error('Chyba při mazání místa')
    }
  }

  const getIcon = (iconName: string | null) => {
    return ICON_MAP[iconName || 'pin'] || MapPin
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Místa</h2>
        <p className="text-sm text-muted-foreground">
          Správa míst pro location-based úkoly. Výchozí místa nelze smazat.
        </p>
      </div>

      {/* Add new location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Přidat nové místo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Název</label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="např. Kavárna, Sklad..."
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ikona</label>
              <div className="flex gap-1">
                {ICON_OPTIONS.map(opt => {
                  const Icon = opt.Icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setNewIcon(opt.value)}
                      className={`p-2 rounded-md border transition-colors ${
                        newIcon === opt.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600'
                      }`}
                      title={opt.label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!newName.trim() || adding}>
              <Plus className="h-4 w-4 mr-1" />
              {adding ? 'Přidávám...' : 'Přidat'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Locations list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Existující místa ({locations.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {locations.map(loc => {
            const Icon = getIcon(loc.icon)
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Icon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium">{loc.name}</span>
                  {loc.is_default && (
                    <Badge variant="secondary" className="text-xs">Výchozí</Badge>
                  )}
                </div>
                {!loc.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(loc.id, loc.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          })}
          {locations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Žádná místa. Přidejte první místo výše.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
