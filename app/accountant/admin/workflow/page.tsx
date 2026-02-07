'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  GitBranch,
  FileText,
  Building2,
  Settings2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  UserCheck,
  Briefcase,
  Bell,
  Hand,
  Zap,
  Filter,
  ArrowRight,
} from 'lucide-react'
import {
  DocumentType,
  ClientWorkflowRule,
  DocumentWorkflowAction,
  DOCUMENT_TYPES,
  MOCK_CLIENT_WORKFLOW_RULES,
  MOCK_TEAM_MEMBERS,
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

export default function WorkflowPage() {
  const [documentTypes, setDocumentTypes] =
    useState<DocumentType[]>(DOCUMENT_TYPES)
  const [clientRules, setClientRules] =
    useState<ClientWorkflowRule[]>(MOCK_CLIENT_WORKFLOW_RULES)
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

  // Mock companies for demo
  const mockCompanies = [
    { id: 'c1', name: 'TechStart s.r.o.' },
    { id: 'c2', name: 'Horák s.r.o.' },
    { id: 'c3', name: 'ABC Company a.s.' },
    { id: 'c4', name: 'XYZ Trading s.r.o.' },
    { id: 'c5', name: 'Nová Firma s.r.o.' },
  ]

  const managers = MOCK_TEAM_MEMBERS.filter(
    (m) => m.role === 'manager' || m.role === 'admin'
  )

  const accountants = MOCK_TEAM_MEMBERS.filter((m) => m.role === 'accountant')

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
    const member = MOCK_TEAM_MEMBERS.find((m) => m.id === id)
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
    const company = mockCompanies.find((c) => c.id === companyId)
    setNewRule({
      ...newRule,
      company_id: companyId,
      company_name: company?.name || '',
    })
  }

  const updateDocumentTypeDefault = (typeId: string, action: DocumentWorkflowAction) => {
    setDocumentTypes(
      documentTypes.map((t) =>
        t.id === typeId ? { ...t, default_action: action } : t
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GitBranch className="h-6 w-6" />
          Workflow dokumentů
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Konfigurace pravidel pro zpracování a schvalování dokumentů
        </p>
      </div>

      <Tabs defaultValue="client-rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="client-rules" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Pravidla klientů
          </TabsTrigger>
          <TabsTrigger value="document-types" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Typy dokumentů
          </TabsTrigger>
        </TabsList>

        {/* Client Rules Tab */}
        <TabsContent value="client-rules" className="space-y-6">
          {/* Search and Add */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Hledat klienta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsAddRuleOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat pravidlo
            </Button>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
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
                  <Card
                    key={rule.id}
                    className={!rule.is_active ? 'opacity-60' : ''}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {rule.company_name}
                            </span>
                            {!rule.is_active && (
                              <Badge variant="secondary">Vypnuto</Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline">
                              <FileText className="h-3 w-3 mr-1" />
                              {getDocumentTypeName(rule.document_type_id)}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <Badge className={actionColors[rule.action]}>
                              <ActionIcon className="h-3 w-3 mr-1" />
                              {actionLabels[rule.action]}
                            </Badge>
                          </div>

                          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {rule.approver_id && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-4 w-4" />
                                {getApproverName(rule.approver_id)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Bell className="h-4 w-4" />
                              {rule.notify_on_upload && 'Při nahrání'}
                              {rule.notify_on_upload && rule.notify_on_approval && ', '}
                              {rule.notify_on_approval && 'Při schválení'}
                              {!rule.notify_on_upload && !rule.notify_on_approval && 'Bez notifikací'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRuleActive(rule.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingRule(rule)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Action Legend */}
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="py-4">
              <h4 className="font-medium mb-3">Typy akcí</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(actionLabels).map(([action, label]) => {
                  const ActionIcon = actionIcons[action as DocumentWorkflowAction]
                  return (
                    <div
                      key={action}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg text-sm
                        ${actionColors[action as DocumentWorkflowAction]}
                      `}
                    >
                      <ActionIcon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Types Tab */}
        <TabsContent value="document-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typy dokumentů a výchozí akce</CardTitle>
              <CardDescription>
                Nastavte výchozí chování pro jednotlivé typy dokumentů. Pravidla
                klientů mají vyšší prioritu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ dokumentu</TableHead>
                    <TableHead>Vyžaduje schválení</TableHead>
                    <TableHead>Výchozí akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentTypes.map((docType) => {
                    const ActionIcon = actionIcons[docType.default_action]
                    return (
                      <TableRow key={docType.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{docType.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {docType.requires_approval ? (
                            <Badge className="bg-orange-100 text-orange-700">
                              Ano
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">
                              Ne
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={docType.default_action}
                            onValueChange={(v) =>
                              updateDocumentTypeDefault(
                                docType.id,
                                v as DocumentWorkflowAction
                              )
                            }
                          >
                            <SelectTrigger className="w-56">
                              <div className="flex items-center gap-2">
                                <ActionIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(actionLabels).map(
                                ([action, label]) => (
                                  <SelectItem key={action} value={action}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Settings2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Priorita pravidel
                  </h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                    <li>
                      Specifické pravidlo pro klienta + typ dokumentu (nejvyšší)
                    </li>
                    <li>Obecné pravidlo pro klienta (všechny dokumenty)</li>
                    <li>Výchozí akce pro typ dokumentu</li>
                    <li>Globální výchozí nastavení (nejnižší)</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  {mockCompanies.map((company) => (
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {clientRules.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pravidel klientů</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {clientRules.filter((r) => r.action === 'auto_approve').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Automatické schválení</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {
                clientRules.filter(
                  (r) =>
                    r.action === 'require_manager_approval' ||
                    r.action === 'require_accountant_approval'
                ).length
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vyžaduje schválení</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">
              {documentTypes.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Typů dokumentů</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
