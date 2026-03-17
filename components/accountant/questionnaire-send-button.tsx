'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Send, Loader2, Clock, CheckCircle2, ClipboardList, Check } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Neodesláno', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  sent: { label: 'Čeká na vyplnění', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Rozpracováno', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Vyplněno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  reviewed: { label: 'Zkontrolováno', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
}

interface QuestionnaireSendButtonProps {
  companyId: string
  year: number
}

export function QuestionnaireSendButton({ companyId, year }: QuestionnaireSendButtonProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/accountant/companies/${companyId}/tax-questionnaire?year=${year}`)
        if (res.ok) {
          const data = await res.json()
          setStatus(data.questionnaire?.status || null)
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [companyId, year])

  const sendToClient = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/accountant/companies/${companyId}/tax-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      })
      if (res.ok) {
        setStatus('sent')
        toast.success('Dotazník odeslán klientovi')
      } else {
        toast.error('Nepodařilo se odeslat')
      }
    } catch {
      toast.error('Nepodařilo se odeslat')
    } finally {
      setSending(false)
    }
  }

  if (loading) return null

  const statusInfo = status ? STATUS_CONFIG[status] : null

  return (
    <div className="flex items-center gap-2">
      {statusInfo && (
        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
      )}
      {!status && (
        <>
          <Button size="sm" variant="outline" onClick={() => setConfirmOpen(true)} disabled={sending}>
            {sending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            Odeslat dotazník
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Odeslat dotazník klientovi?"
            description={`Klient obdrží daňový dotazník za rok ${year} k vyplnění.`}
            confirmLabel="Odeslat"
            onConfirm={sendToClient}
          />
        </>
      )}
    </div>
  )
}
