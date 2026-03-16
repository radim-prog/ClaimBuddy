'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, GripVertical, Loader2, FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FolderTemplate } from '@/lib/types/drive'

export function OperationsFolderTemplates() {
  const [templates, setTemplates] = useState<FolderTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/drive/folder-templates')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch {
      setError('Nepodařilo se načíst šablony složek')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch('/api/drive/folder-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }
      const data = await res.json()
      setSuccess(`Složka "${newName.trim()}" přidána ke všem ${data.provisioned} firmám`)
      setNewName('')
      await fetchTemplates()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      setError(null)
      const res = await fetch('/api/drive/folder-templates', { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Sync failed')
      }
      const data = await res.json()
      setSuccess(`Synchronizováno: ${data.templates} šablon → ${data.synced} firem`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při synchronizaci')
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async (template: FolderTemplate) => {
    if (!confirm(`Smazat složku "${template.name}" u všech klientů? Soubory v nich budou ztraceny.`)) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/drive/folder-templates?id=${template.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setSuccess(`Složka "${template.name}" smazána`)
      await fetchTemplates()
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Předdefinovaná struktura složek pro všechny klienty. Přidání složky ji automaticky vytvoří u všech firem.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing || saving}
          className="shrink-0 ml-4"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Synchronizovat
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Template list */}
      <div className="rounded-lg border border-border overflow-hidden">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Zatim nejsou definovany zadne slozky
          </div>
        ) : (
          <div className="divide-y divide-border">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <FolderOpen className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="text-sm font-medium flex-1">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.has_period_filter ? 'Perioda' : 'Bez periody'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500"
                  onClick={() => handleDelete(t)}
                  disabled={saving}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nazev nove slozky..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 h-9 text-sm"
          disabled={saving}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={saving || !newName.trim()}
          className="shrink-0"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Plus className="h-4 w-4 mr-1.5" />
          )}
          Pridat
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Standardni slozky jsou: Faktury prijate, Faktury vydane, Vypisy z uctu, Smlouvy, Mzdy, Pojistne smlouvy, Danova priznani, Ostatni
      </p>
    </div>
  )
}
