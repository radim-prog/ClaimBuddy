'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Mail, Settings, Filter } from 'lucide-react'
import { toast } from 'sonner'
import type { CaseEmailInbox, CaseEmailRule } from '@/lib/types/project'

export function EmailInboxSettings() {
  const [inboxes, setInboxes] = useState<CaseEmailInbox[]>([])
  const [rules, setRules] = useState<CaseEmailRule[]>([])
  const [inboxDialogOpen, setInboxDialogOpen] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [newInbox, setNewInbox] = useState({ email_address: '', display_name: '' })
  const [newRule, setNewRule] = useState<{ rule_type: 'sender' | 'subject' | 'domain'; match_value: string; target_project_id: string }>({ rule_type: 'sender', match_value: '', target_project_id: '' })

  const fetchData = () => {
    fetch('/api/case-email-inboxes').then(r => r.json()).then(d => setInboxes(d.inboxes || [])).catch(() => {})
    fetch('/api/case-email-rules').then(r => r.json()).then(d => setRules(d.rules || [])).catch(() => {})
  }

  useEffect(() => { fetchData() }, [])

  const handleAddInbox = async () => {
    if (!newInbox.email_address) return
    try {
      const res = await fetch('/api/case-email-inboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInbox),
      })
      if (res.ok) {
        toast.success('Schránka přidána')
        setInboxDialogOpen(false)
        setNewInbox({ email_address: '', display_name: '' })
        fetchData()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleAddRule = async () => {
    if (!newRule.match_value) return
    try {
      const res = await fetch('/api/case-email-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })
      if (res.ok) {
        toast.success('Pravidlo přidáno')
        setRuleDialogOpen(false)
        setNewRule({ rule_type: 'sender', match_value: '', target_project_id: '' })
        fetchData()
      }
    } catch {
      toast.error('Chyba')
    }
  }

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`/api/case-email-rules?id=${id}`, { method: 'DELETE' })
      toast.success('Pravidlo smazáno')
      fetchData()
    } catch {
      toast.error('Chyba')
    }
  }

  const ruleTypeLabels: Record<string, string> = {
    sender: 'Odesílatel',
    subject: 'Předmět',
    domain: 'Doména',
  }

  return (
    <div className="space-y-4">
      {/* Inboxes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Emailové schránky
            </span>
            <Dialog open={inboxDialogOpen} onOpenChange={setInboxDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Přidat</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Přidat emailovou schránku</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email adresa</Label>
                    <Input
                      placeholder="ucetni@firma.cz"
                      value={newInbox.email_address}
                      onChange={(e) => setNewInbox(p => ({ ...p, email_address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Zobrazovaný název</Label>
                    <Input
                      placeholder="Hlavní schránka"
                      value={newInbox.display_name}
                      onChange={(e) => setNewInbox(p => ({ ...p, display_name: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddInbox} disabled={!newInbox.email_address}>Přidat</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inboxes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Žádné schránky</p>
          ) : (
            <div className="space-y-2">
              {inboxes.map(inbox => (
                <div key={inbox.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div>
                    <span className="font-medium">{inbox.email_address}</span>
                    {inbox.display_name && <span className="text-muted-foreground ml-2">({inbox.display_name})</span>}
                  </div>
                  <Badge variant={inbox.is_active ? 'default' : 'secondary'}>
                    {inbox.is_active ? 'Aktivní' : 'Neaktivní'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Auto-přiřazovací pravidla
            </span>
            <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Přidat</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nové pravidlo</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Typ pravidla</Label>
                    <Select value={newRule.rule_type} onValueChange={(v) => setNewRule(p => ({ ...p, rule_type: v as 'sender' | 'subject' | 'domain' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sender">Odesílatel (email)</SelectItem>
                        <SelectItem value="subject">Předmět (obsahuje)</SelectItem>
                        <SelectItem value="domain">Doména (@...)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hodnota</Label>
                    <Input
                      placeholder={newRule.rule_type === 'domain' ? 'firma.cz' : newRule.rule_type === 'sender' ? 'jan@firma.cz' : 'Klíčové slovo'}
                      value={newRule.match_value}
                      onChange={(e) => setNewRule(p => ({ ...p, match_value: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleAddRule} disabled={!newRule.match_value}>Přidat pravidlo</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Žádná pravidla</p>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{ruleTypeLabels[rule.rule_type]}</Badge>
                    <span className="font-mono text-xs">{rule.match_value}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
