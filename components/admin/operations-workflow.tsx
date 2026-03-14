'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  GitBranch,
  FileText,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  UserCheck,
  Briefcase,
  Bell,
  Hand,
  Zap,
  ArrowRight,
} from 'lucide-react'
import {
  DocumentType,
  ClientWorkflowRule,
  DocumentWorkflowAction,
  TeamMember,
  DOCUMENT_TYPES,
} from '@/lib/types/admin'

const actionLabels: Record<DocumentWorkflowAction, string> = {
  auto_approve: 'Automatické schválení',
  require_manager_approval: 'Schválení manažerem',
  require_accountant_approval: 'Schválení účetní',
  notify_only: 'Pouze notifikace',
  manual: 'Manuální zpracování',
}

const actionColors: Record<DocumentWorkflowAction, string> = {
  auto_approve: 'bg-green-100 text-green-700',
  require_manager_approval: 'bg-blue-100 text-blue-700',
  require_accountant_approval: 'bg-purple-100 text-purple-700',
  notify_only: 'bg-yellow-100 text-yellow-700',
  manual: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
}

const actionIcons: Record<DocumentWorkflowAction, typeof Check> = {
  auto_approve: Zap,
  require_manager_approval: Briefcase,
  require_accountant_approval: UserCheck,
  notify_only: Bell,
  manual: Hand,
}

export function OperationsWorkflow() {
  const [documentTypes] = useState<DocumentType[]>(DOCUMENT_TYPES)
  const [clientRules, setClientRules] = useState<ClientWorkflowRule[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ClientWorkflowRule | null>(null)

  // New rule form state
  const [newRule, setNewRule] = useState({
    company_id: '',
    company_name: '',
    document_type_id: '',
    action: 'auto_approve' as DocumentWorkflowAction,
    approver_id: '',
    notify_on_upload: true,
    notify_on_approval: true,
  })

  const fetchData = useCallback(() => {
    Promise.all([
      fetch('/api/accountant/admin/workflow-rules').then(r => r.json()),
      fetch('/api/accountant/admin/team').then(r => r.json()),
      fetch('/api/accountant/companies').then(r => r.json()),
    ])
      .then(([rulesData, teamData, companiesData]) => {
        setClientRules(rulesData.rules || [])
        setTeamMembers(teamData.members || [])
        setCompanies((companiesData.companies || []).map((c: any) => ({ id: c.id, name: c.name })))
      })
      .catch(err => console.error('Error loading workflow data:', err))
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const managers = useMemo(() =>
    teamMembers.filter(m => m.role === 'manager' || m.role === 'admin'),
    [teamMembers]
  )

  const accountants = useMemo(() =>
    teamMembers.filter(m => m.role === 'accountant'),
    [teamMembers]
  )

  const filteredRules = useMemo(() => {
    return clientRules.filter((rule) =>
      rule.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [clientRules, searchTerm])

  const getDocumentTypeName = (id?: string) => {
    if (!id) return 'Všechny dokumenty'
    return documentTypes.find((t) => t.id === id)?.name || id
  }

  const getApproverName = (id?: string) => {
    if (!id) return 'Automaticky'
    const member = teamMembers.find((m) => m.id === id)
    return member?.name || id
  }

  const handleAddRule = () => {
    const rule: ClientWorkflowRule = {
      id: (Math.max(...clientRules.map((r) => parseInt(r.id)), 0) + 1).toString(),
      company_id: newRule.company_id,
      company_name: newRule.company_name,
      document_type_id: newRule.document_type_id || undefined,
      action: newRule.action,
      approver_id: newRule.approver_id || undefined,
      notify_on_upload: newRule.notify_on_upload,
      notify_on_approval: newRule.notify_on_approval,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: '1',
    }
    setClientRules([...clientRules, rule])
    setNewRule({
      company_id: '',
      company_name: '',
      document_type_id: '',
      action: 'auto_approve',
      approver_id: '',
      notify_on_upload: true,
      notify_on_approval: true,
    })
    setIsAddRuleOpen(false)
  }

  const handleDeleteRule = (id: string) => {
    setClientRules(clientRules.filter((r) => r.id !== id))
  }

  const toggleRuleActive = (id: string) => {
    setClientRules(
      clientRules.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      )
    )
  }

  const handleSelectCompany = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    setNewRule({
      ...newRule,
      company_id: companyId,
      company_name: company?.name || '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Hledat klienta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setIsAddRuleOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Přidat
        </Button>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Žádná pravidla pro klienty
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddRuleOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Přidat první pravidlo
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredRules.map((rule) => {
            const ActionIcon = actionIcons[rule.action]
            return (
              <div
                key={rule.id}
                className={`flex items-center gap-3 px-3 py-2 border rounded-lg ${!rule.is_active ? 'opacity-60' : ''}`}
              >
                <Building2 className="h-4 w-4 text-gray-500 shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                  <span className="text-sm font-medium">{rule.company_name}</span>
                  {!rule.is_active && <Badge variant="secondary" className="text-[10px] h-4">Off</Badge>}
                  <Badge variant="outline" className="text-[10px] h-5">
                    <FileText className="h-2.5 w-2.5 mr-0.5" />
                    {getDocumentTypeName(rule.document_type_id)}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <Badge className={`text-[10px] h-5 ${actionColors[rule.action]}`}>
                    <ActionIcon className="h-2.5 w-2.5 mr-0.5" />
                    {actionLabels[rule.action]}
                  </Badge>
                  {rule.approver_id && (
                    <span className="text-xs text-gray-400">{getApproverName(rule.approver_id)}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => toggleRuleActive(rule.id)}
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingRule(rule)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteRule(rule.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Přidat pravidlo workflow</DialogTitle>
            <DialogDescription>
              Definujte jak se budou zpracovávat dokumenty pro konkrétního klienta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Company */}
            <div className="space-y-2">
              <Label>Klient</Label>
              <Select
                value={newRule.company_id}
                onValueChange={handleSelectCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte klienta" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label>Typ dokumentu</Label>
              <Select
                value={newRule.document_type_id}
                onValueChange={(v) =>
                  setNewRule({ ...newRule, document_type_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Všechny dokumenty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Všechny dokumenty</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label>Akce</Label>
              <Select
                value={newRule.action}
                onValueChange={(v) =>
                  setNewRule({
                    ...newRule,
                    action: v as DocumentWorkflowAction,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([action, label]) => (
                    <SelectItem key={action} value={action}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approver - only for approval actions */}
            {(newRule.action === 'require_manager_approval' ||
              newRule.action === 'require_accountant_approval') && (
              <div className="space-y-2">
                <Label>Schvalovatel</Label>
                <Select
                  value={newRule.approver_id}
                  onValueChange={(v) =>
                    setNewRule({ ...newRule, approver_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Automaticky dle hierarchie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Automaticky dle hierarchie</SelectItem>
                    {newRule.action === 'require_manager_approval'
                      ? managers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      : accountants.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notifications */}
            <div className="space-y-3">
              <Label>Notifikace</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newRule.notify_on_upload}
                    onCheckedChange={(c) =>
                      setNewRule({ ...newRule, notify_on_upload: c })
                    }
                  />
                  <span className="text-sm">Při nahrání dokumentu</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={newRule.notify_on_approval}
                    onCheckedChange={(c) =>
                      setNewRule({ ...newRule, notify_on_approval: c })
                    }
                  />
                  <span className="text-sm">Při schválení/zamítnutí</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRuleOpen(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleAddRule}
              disabled={!newRule.company_id}
            >
              <Check className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog */}
      <Dialog
        open={!!editingRule}
        onOpenChange={(open) => !open && setEditingRule(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upravit pravidlo workflow</DialogTitle>
            <DialogDescription>
              {editingRule?.company_name}
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4 py-4">
              {/* Document Type */}
              <div className="space-y-2">
                <Label>Typ dokumentu</Label>
                <Select
                  value={editingRule.document_type_id || ''}
                  onValueChange={(v) => {
                    setClientRules(
                      clientRules.map((r) =>
                        r.id === editingRule.id
                          ? { ...r, document_type_id: v || undefined }
                          : r
                      )
                    )
                    setEditingRule({
                      ...editingRule,
                      document_type_id: v || undefined,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Všechny dokumenty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Všechny dokumenty</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action */}
              <div className="space-y-2">
                <Label>Akce</Label>
                <Select
                  value={editingRule.action}
                  onValueChange={(v) => {
                    const newAction = v as DocumentWorkflowAction
                    setClientRules(
                      clientRules.map((r) =>
                        r.id === editingRule.id
                          ? { ...r, action: newAction }
                          : r
                      )
                    )
                    setEditingRule({ ...editingRule, action: newAction })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(actionLabels).map(([action, label]) => (
                      <SelectItem key={action} value={action}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <Label>Notifikace</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={editingRule.notify_on_upload}
                      onCheckedChange={(c) => {
                        setClientRules(
                          clientRules.map((r) =>
                            r.id === editingRule.id
                              ? { ...r, notify_on_upload: c }
                              : r
                          )
                        )
                        setEditingRule({ ...editingRule, notify_on_upload: c })
                      }}
                    />
                    <span className="text-sm">Při nahrání dokumentu</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={editingRule.notify_on_approval}
                      onCheckedChange={(c) => {
                        setClientRules(
                          clientRules.map((r) =>
                            r.id === editingRule.id
                              ? { ...r, notify_on_approval: c }
                              : r
                          )
                        )
                        setEditingRule({ ...editingRule, notify_on_approval: c })
                      }}
                    />
                    <span className="text-sm">Při schválení/zamítnutí</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditingRule(null)}>Zavřít</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
