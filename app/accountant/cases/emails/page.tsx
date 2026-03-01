'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Mail, Paperclip, RefreshCw, Settings, Briefcase, Clock, CheckCircle } from 'lucide-react'
import { EmailAssignDialog } from '@/components/case/email-assign-dialog'
import { EmailInboxSettings } from '@/components/case/email-inbox-settings'
import { toast } from 'sonner'
import type { CaseEmail } from '@/lib/types/project'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  unassigned: { label: 'Nepřiřazeno', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  assigned: { label: 'Přiřazeno', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  auto_assigned: { label: 'Auto', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  ignored: { label: 'Ignorováno', color: 'bg-gray-100 text-gray-600', icon: Mail },
}

export default function CaseEmailsPage() {
  const [emails, setEmails] = useState<CaseEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState('unassigned')
  const [selectedEmail, setSelectedEmail] = useState<CaseEmail | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/case-emails${params}`)
      const data = await res.json()
      setEmails(data.emails || [])
    } catch {}
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/cron/fetch-emails', { method: 'POST' })
      const data = await res.json()
      toast.success(`Synchronizace dokončena: ${data.fetched || 0} nových emailů`)
      fetchEmails()
    } catch {
      toast.error('Chyba při synchronizaci')
    } finally {
      setSyncing(false)
    }
  }

  const handleIgnore = async (emailId: string) => {
    try {
      await fetch(`/api/case-emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      })
      toast.success('Email ignorován')
      fetchEmails()
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" /> Příchozí emaily
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizace...' : 'Synchronizovat'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-1" />
            Nastavení
          </Button>
        </div>
      </div>

      {showSettings && <EmailInboxSettings />}

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="unassigned">Nepřiřazené</TabsTrigger>
          <TabsTrigger value="assigned">Přiřazené</TabsTrigger>
          <TabsTrigger value="auto_assigned">Auto</TabsTrigger>
          <TabsTrigger value="all">Vše</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">Načítání...</CardContent>
            </Card>
          ) : emails.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Žádné emaily v této kategorii</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {emails.map(email => {
                  const statusCfg = STATUS_CONFIG[email.status] || STATUS_CONFIG.unassigned
                  return (
                    <Card key={email.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">{email.from_name || email.from_address}</span>
                              <Badge className={`${statusCfg.color} text-xs`}>{statusCfg.label}</Badge>
                              {email.has_attachments && (
                                <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium truncate">{email.subject}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {email.body_text?.substring(0, 150) || '(bez obsahu)'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(email.received_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="truncate">{email.from_address}</span>
                            </div>
                          </div>
                          {email.status === 'unassigned' && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmail(email)
                                  setAssignDialogOpen(true)
                                }}
                              >
                                <Briefcase className="h-3.5 w-3.5 mr-1" /> Přiřadit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleIgnore(email.id)}
                              >
                                Ignorovat
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign dialog */}
      {selectedEmail && (
        <EmailAssignDialog
          emailId={selectedEmail.id}
          emailSubject={selectedEmail.subject}
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open)
            if (!open) setSelectedEmail(null)
          }}
          onAssigned={fetchEmails}
        />
      )}
    </div>
  )
}
