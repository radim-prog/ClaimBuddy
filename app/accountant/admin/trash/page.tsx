'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Trash2, RotateCcw, Search, FileText, Receipt, ListTodo,
  FolderOpen, Users2, AlertTriangle, Settings2, Clock, Lock,
} from 'lucide-react'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type ResourceType = 'documents' | 'invoices' | 'tasks' | 'projects' | 'invoice_partners'

interface TrashItem {
  id: string
  type: ResourceType
  type_label: string
  name: string
  company_id: string | null
  company_name: string | null
  deleted_at: string
  deleted_by: string | null
  metadata: Record<string, unknown>
}

const typeFilters: { value: ResourceType | 'all'; label: string; icon: typeof FileText }[] = [
  { value: 'all', label: 'Vše', icon: Trash2 },
  { value: 'documents', label: 'Dokumenty', icon: FileText },
  { value: 'invoices', label: 'Faktury', icon: Receipt },
  { value: 'tasks', label: 'Úkoly', icon: ListTodo },
  { value: 'projects', label: 'Projekty', icon: FolderOpen },
  { value: 'invoice_partners', label: 'Partneři', icon: Users2 },
]

const typeColors: Record<ResourceType, string> = {
  documents: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  invoices: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  tasks: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  projects: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  invoice_partners: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const retentionOptions = [
  { value: 30, label: '30 dní' },
  { value: 60, label: '60 dní' },
  { value: 90, label: '90 dní' },
]

export default function TrashPage() {
  const { userRole } = useAccountantUser()
  const { hasFeature } = usePlanFeatures()
  const isAdmin = userRole === 'admin'

  const [deleteConfirm, setDeleteConfirm] = useState<TrashItem | null>(null)
  const [items, setItems] = useState<TrashItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [retentionDays, setRetentionDays] = useState(30)
  const [showSettings, setShowSettings] = useState(false)
  const [gated, setGated] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '200' })
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await fetch(`/api/accountant/trash?${params}`)
      if (res.status === 403) {
        const data = await res.json()
        if (data.requiredTier) {
          setGated(true)
          return
        }
      }
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setRetentionDays(data.retention_days || 30)
      }
    } catch {
      toast.error('Chyba při načítání koše')
    } finally {
      setLoading(false)
    }
  }, [typeFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleRestore = async (item: TrashItem) => {
    try {
      const res = await fetch('/api/accountant/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: item.type }),
      })
      if (res.ok) {
        toast.success(`${item.type_label} "${item.name}" obnoven(a)`)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba při obnovení')
      }
    } catch {
      toast.error('Chyba při obnovení')
    }
  }

  const handlePermanentDelete = async (item: TrashItem) => {
    try {
      const res = await fetch(`/api/accountant/trash?id=${item.id}&type=${item.type}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Trvale smazáno')
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba')
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleRetentionChange = async (days: number) => {
    try {
      const res = await fetch('/api/accountant/trash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention_days: days }),
      })
      if (res.ok) {
        setRetentionDays(days)
        toast.success(`Retence nastavena na ${days} dní`)
      }
    } catch {
      toast.error('Chyba')
    }
  }

  // Gated view
  if (gated) {
    return (
      <div className="text-center py-16">
        <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Koš vyžaduje vyšší tarif</h2>
        <p className="text-muted-foreground mb-4">
          Funkce Koš je dostupná od tarifu Professional.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
          Zobrazit tarify
        </Button>
      </div>
    )
  }

  const filtered = search.trim()
    ? items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.company_name || '').toLowerCase().includes(search.toLowerCase())
      )
    : items

  // Stats per type
  const typeCounts = items.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getDaysUntilPurge = (deletedAt: string) => {
    const deleted = new Date(deletedAt)
    const purgeDate = new Date(deleted.getTime() + retentionDays * 24 * 60 * 60 * 1000)
    const now = new Date()
    const days = Math.ceil((purgeDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    return Math.max(0, days)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Koš
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Smazané položky — automatické smazání po {retentionDays} dnech
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Nastavení
          </Button>
        )}
      </div>

      {/* Retention settings */}
      {showSettings && isAdmin && (
        <Card className="rounded-xl border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 pb-4">
            <h3 className="text-sm font-medium mb-3">Doba uchování v koši</h3>
            <div className="flex gap-2">
              {retentionOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={retentionDays === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRetentionChange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Položky starší než {retentionDays} dní budou automaticky trvale smazány.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {typeFilters.map(tf => {
          const Icon = tf.icon
          const count = tf.value === 'all' ? items.length : (typeCounts[tf.value] || 0)
          return (
            <button
              key={tf.value}
              onClick={() => setTypeFilter(tf.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors ${
                typeFilter === tf.value
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{count}</span>
              <span className="text-[10px] text-muted-foreground">{tf.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat v koši..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Item list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Načítání...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground">Koš je prázdný</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const daysLeft = getDaysUntilPurge(item.deleted_at)
            const isUrgent = daysLeft <= 3

            return (
              <Card key={`${item.type}-${item.id}`} className={`rounded-xl ${isUrgent ? 'border-red-200 dark:border-red-800' : ''}`}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  {/* Type badge */}
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${typeColors[item.type]}`}>
                    {item.type_label}
                  </Badge>

                  {/* Name + company */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.company_name && <span>{item.company_name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.deleted_at).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className={`flex items-center gap-1 ${isUrgent ? 'text-red-500 font-medium' : ''}`}>
                        {isUrgent && <AlertTriangle className="h-3 w-3" />}
                        {daysLeft}d do smazání
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(item)}
                      title="Obnovit"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Obnovit
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteConfirm(item)}
                        title="Trvale smazat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}
        title="Trvalé smazání"
        description={`Opravdu TRVALE smazat "${deleteConfirm?.name}"? Tuto akci nelze vrátit zpět.`}
        confirmLabel="Trvale smazat"
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirm) {
            handlePermanentDelete(deleteConfirm)
          }
          setDeleteConfirm(null)
        }}
      />
    </div>
  )
}
