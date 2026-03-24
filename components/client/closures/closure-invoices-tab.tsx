'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Receipt, Eye, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UnmatchedIncome {
  id: string
  amount: number
  transaction_date: string
  counterparty_name?: string | null
  variable_symbol?: string | null
  description?: string | null
}

interface ClosureInvoicesTabProps {
  matchedCount: number
  unmatchedIncome: UnmatchedIncome[]
  totalIncome: number
  className?: string
}

export function ClosureInvoicesTab({ matchedCount, unmatchedIncome, totalIncome, className }: ClosureInvoicesTabProps) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [markedPrivate, setMarkedPrivate] = useState<Set<string>>(new Set())

  const handleMarkPrivate = useCallback(async (txId: string) => {
    try {
      const res = await fetch('/api/client/closures/mark-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId }),
      })
      if (res.ok) {
        setMarkedPrivate(prev => new Set(prev).add(txId))
      }
    } catch {
      toast.error('Akce se nezdařila')
    }
  }, [])

  const handleSaveNote = useCallback(async (txId: string, note: string) => {
    try {
      await fetch('/api/client/closures/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, note }),
      })
      setNotes(prev => ({ ...prev, [txId]: note }))
      setEditingNote(null)
    } catch {
      toast.error('Akce se nezdařila')
    }
  }, [])

  const visibleIncome = unmatchedIncome.filter(tx => !markedPrivate.has(tx.id))

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(totalIncome).toLocaleString('cs-CZ')}
            </p>
            <p className="text-xs text-muted-foreground">Celkové příjmy (Kč)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
            <p className="text-xs text-muted-foreground">Spárováno s fakturou</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{visibleIncome.length}</p>
            <p className="text-xs text-muted-foreground">Bez faktury</p>
          </CardContent>
        </Card>
      </div>

      {/* Unmatched income */}
      {visibleIncome.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Příjmy bez přiřazené faktury ({visibleIncome.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {visibleIncome.map(tx => (
                <div key={tx.id} className="py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-yellow-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {tx.counterparty_name || tx.description || 'Neznámý plátce'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(tx.transaction_date).toLocaleDateString('cs-CZ')}</span>
                        {tx.variable_symbol && <span>VS: {tx.variable_symbol}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-medium text-green-600 shrink-0">
                      +{tx.amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2 })} Kč
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleMarkPrivate(tx.id)}
                        title="Označí tento příjem jako soukromý (nesouvisí s podnikáním)"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Soukromé
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setEditingNote(editingNote === tx.id ? null : tx.id)}
                        title="Přidat poznámku k této transakci"
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />
                        Poznámka
                      </Button>
                    </div>
                  </div>
                  {/* Note display/editor */}
                  {notes[tx.id] && editingNote !== tx.id && (
                    <p className="text-xs text-muted-foreground ml-7 italic">
                      Poznámka: {notes[tx.id]}
                    </p>
                  )}
                  {editingNote === tx.id && (
                    <div className="ml-7 flex gap-2">
                      <input
                        type="text"
                        className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                        placeholder="Napište poznámku..."
                        defaultValue={notes[tx.id] || ''}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(tx.id, (e.target as HTMLInputElement).value)
                          if (e.key === 'Escape') setEditingNote(null)
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)
                          if (input) handleSaveNote(tx.id, input.value)
                        }}
                      >
                        Uložit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {visibleIncome.length === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Všechny příjmy jsou spárované s fakturami</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
