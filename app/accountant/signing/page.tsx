'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileSignature,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Send,
  Ban,
  Upload,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// --------------- Types ---------------

interface SigningJob {
  id: string
  document_name: string
  document_type: string
  status: string
  signature_type: string
  signers: Signer[]
  note?: string
  created_at: string
  completed_at?: string
  signi_envelope_id?: string
}

interface Signer {
  name: string
  email: string
  phone?: string
  role: 'sign' | 'approve'
}

interface SigningTemplate {
  id: string
  name: string
  file_name: string
  placeholder_count: number
  created_at: string
}

interface SigningSettings {
  api_key_configured: boolean
  api_key_last4?: string
  workspace_name?: string
  connected: boolean
}

// --------------- Constants ---------------

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  draft: { label: 'Koncept', variant: 'secondary', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  pending: { label: 'Čekající', variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' },
  signed: { label: 'Podepsáno', variant: 'default', className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
  rejected: { label: 'Odmítnuto', variant: 'destructive', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  expired: { label: 'Expirováno', variant: 'outline', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' },
  error: { label: 'Chyba', variant: 'destructive', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' },
  cancelled: { label: 'Zrušeno', variant: 'secondary', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: 'Smlouva',
  amendment: 'Dodatek',
  power_of_attorney: 'Plná moc',
  mandate: 'Mandátní smlouva',
  price_addendum: 'Cenový dodatek',
  other: 'Jiné',
}

const SIGNATURE_TYPE_LABELS: Record<string, string> = {
  simple: 'Jednoduchý',
  advanced: 'Zaručený',
  qualified: 'Kvalifikovaný',
}

// --------------- Component ---------------

export default function SigningPage() {
  const [jobs, setJobs] = useState<SigningJob[]>([])
  const [templates, setTemplates] = useState<SigningTemplate[]>([])
  const [settings, setSettings] = useState<SigningSettings | null>(null)
  const [activeTab, setActiveTab] = useState('contracts')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New contract wizard state
  const [wizardStep, setWizardStep] = useState(1)
  const [newContract, setNewContract] = useState({
    document_name: '',
    document_type: 'contract',
    signature_type: 'simple',
    template_id: '',
    signers: [{ name: '', email: '', phone: '', role: 'sign' as const }],
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Settings tab state
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Template upload state
  const [templateName, setTemplateName] = useState('')
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [uploadingTemplate, setUploadingTemplate] = useState(false)

  // --------------- Fetch functions ---------------

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/signing')
      if (!res.ok) throw new Error('Nepodařilo se načíst smlouvy')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err: unknown) {
      console.error('Error fetching signing jobs:', err)
      setError('Nepodařilo se načíst smlouvy')
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/signing/templates')
      if (!res.ok) throw new Error('Nepodařilo se načíst šablony')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err: unknown) {
      console.error('Error fetching templates:', err)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/accountant/signing/settings')
      if (!res.ok) throw new Error('Nepodařilo se načíst nastavení')
      const data = await res.json()
      setSettings(data)
    } catch (err: unknown) {
      console.error('Error fetching settings:', err)
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchJobs(), fetchTemplates(), fetchSettings()]).finally(() => setLoading(false))
  }, [fetchJobs, fetchTemplates, fetchSettings])

  // --------------- KPI calculations ---------------

  const kpi = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    signed: jobs.filter(j => j.status === 'signed').length,
    rejectedExpired: jobs.filter(j => j.status === 'rejected' || j.status === 'expired').length,
  }

  // --------------- Actions ---------------

  const handleSendContract = async (id: string) => {
    try {
      const res = await fetch(`/api/accountant/signing/${id}/send`, { method: 'POST' })
      if (!res.ok) throw new Error('Nepodařilo se odeslat smlouvu')
      await fetchJobs()
    } catch (err: unknown) {
      console.error('Error sending contract:', err)
      alert('Nepodařilo se odeslat smlouvu k podpisu.')
    }
  }

  const handleCancelContract = async (id: string) => {
    if (!confirm('Opravdu chcete zrušit tuto smlouvu?')) return
    try {
      const res = await fetch(`/api/accountant/signing/${id}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error('Nepodařilo se zrušit smlouvu')
      await fetchJobs()
    } catch (err: unknown) {
      console.error('Error cancelling contract:', err)
      alert('Nepodařilo se zrušit smlouvu.')
    }
  }

  const handleCreateContract = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/accountant/signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_name: newContract.document_name,
          document_type: newContract.document_type,
          signature_type: newContract.signature_type,
          template_id: newContract.template_id || undefined,
          signers: newContract.signers.filter(s => s.name && s.email),
          note: newContract.note || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Nepodařilo se vytvořit smlouvu')
      }
      setShowNewDialog(false)
      resetWizard()
      await fetchJobs()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepodařilo se vytvořit smlouvu'
      alert(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadTemplate = async () => {
    if (!templateFile || !templateName.trim()) return
    setUploadingTemplate(true)
    try {
      const formData = new FormData()
      formData.append('file', templateFile)
      formData.append('name', templateName.trim())
      const res = await fetch('/api/accountant/signing/templates', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Nepodařilo se nahrát šablonu')
      setTemplateName('')
      setTemplateFile(null)
      await fetchTemplates()
    } catch (err: unknown) {
      console.error('Error uploading template:', err)
      alert('Nepodařilo se nahrát šablonu.')
    } finally {
      setUploadingTemplate(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMessage(null)
    try {
      const res = await fetch('/api/accountant/signing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput }),
      })
      if (!res.ok) throw new Error('Nepodařilo se uložit nastavení')
      setSettingsMessage({ type: 'success', text: 'Nastavení bylo uloženo.' })
      setApiKeyInput('')
      await fetchSettings()
    } catch (err: unknown) {
      console.error('Error saving settings:', err)
      setSettingsMessage({ type: 'error', text: 'Nepodařilo se uložit nastavení.' })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setSettingsMessage(null)
    try {
      const res = await fetch('/api/accountant/signing/settings')
      if (!res.ok) throw new Error('Test selhal')
      const data = await res.json()
      if (data.connected) {
        setSettingsMessage({ type: 'success', text: `Připojení funguje. Workspace: ${data.workspace_name || 'OK'}` })
      } else {
        setSettingsMessage({ type: 'error', text: 'Připojení selhalo. Zkontrolujte API klíč.' })
      }
    } catch (err: unknown) {
      console.error('Error testing connection:', err)
      setSettingsMessage({ type: 'error', text: 'Test připojení selhal.' })
    } finally {
      setTestingConnection(false)
    }
  }

  // --------------- Wizard helpers ---------------

  const resetWizard = () => {
    setWizardStep(1)
    setNewContract({
      document_name: '',
      document_type: 'contract',
      signature_type: 'simple',
      template_id: '',
      signers: [{ name: '', email: '', phone: '', role: 'sign' }],
      note: '',
    })
  }

  const addSigner = () => {
    setNewContract(prev => ({
      ...prev,
      signers: [...prev.signers, { name: '', email: '', phone: '', role: 'sign' }],
    }))
  }

  const removeSigner = (index: number) => {
    setNewContract(prev => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }))
  }

  const updateSigner = (index: number, field: keyof Signer, value: string) => {
    setNewContract(prev => ({
      ...prev,
      signers: prev.signers.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }))
  }

  const canProceedStep1 = newContract.document_name.trim().length > 0
  const canProceedStep2 = newContract.signers.some(s => s.name.trim() && s.email.trim())

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // --------------- Render ---------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Elektronické podepisování</h1>
          <p className="text-muted-foreground mt-1">Správa smluv a dokumentů k podpisu přes Signi.com</p>
        </div>
        <Button onClick={() => { resetWizard(); setShowNewDialog(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nová smlouva
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Celkem smluv</p>
                <p className="text-2xl font-bold mt-1">{kpi.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <FileSignature className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Čekající na podpis</p>
                <p className="text-2xl font-bold mt-1">{kpi.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Podepsané</p>
                <p className="text-2xl font-bold mt-1">{kpi.signed}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Odmítnuté / Expirované</p>
                <p className="text-2xl font-bold mt-1">{kpi.rejectedExpired}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contracts">Smlouvy</TabsTrigger>
          <TabsTrigger value="templates">Šablony</TabsTrigger>
          <TabsTrigger value="settings">Nastavení</TabsTrigger>
        </TabsList>

        {/* ============ Tab: Smlouvy ============ */}
        <TabsContent value="contracts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileSignature className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Zatím nemáte žádné smlouvy</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                    Vytvořte první smlouvu k elektronickému podpisu.
                  </p>
                  <Button variant="outline" onClick={() => { resetWizard(); setShowNewDialog(true) }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nová smlouva
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Název dokumentu</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Stav</TableHead>
                      <TableHead>Podepisující</TableHead>
                      <TableHead>Vytvořeno</TableHead>
                      <TableHead className="text-right">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => {
                      const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft
                      const signerCount = job.signers?.length || 0
                      const signerLabel = signerCount === 1 ? 'osoba' : signerCount >= 2 && signerCount <= 4 ? 'osoby' : 'osob'
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">{job.document_name}</TableCell>
                          <TableCell>{DOC_TYPE_LABELS[job.document_type] || job.document_type}</TableCell>
                          <TableCell>
                            <Badge variant={statusCfg.variant} className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {signerCount} {signerLabel}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(job.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" title="Zobrazit detail">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {job.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Odeslat k podpisu"
                                  onClick={() => handleSendContract(job.id)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {(job.status === 'draft' || job.status === 'pending') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Zrušit"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => handleCancelContract(job.id)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab: Šablony ============ */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {/* Upload form */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-6 pb-6 border-b">
                <div className="flex-1 w-full sm:w-auto">
                  <Label htmlFor="template-name">Název šablony</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="např. Mandátní smlouva 2026"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <Label htmlFor="template-file">Soubor (.docx)</Label>
                  <Input
                    id="template-file"
                    type="file"
                    accept=".docx"
                    onChange={e => setTemplateFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleUploadTemplate}
                  disabled={!templateName.trim() || !templateFile || uploadingTemplate}
                >
                  {uploadingTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Nahrát šablonu
                </Button>
              </div>

              {/* Template list */}
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Zatím nemáte žádné šablony.</p>
                  <p className="text-sm mt-1">Nahrajte .docx soubor s placeholdery pro automatické vyplňování.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Název</TableHead>
                      <TableHead>Soubor</TableHead>
                      <TableHead>Placeholdery</TableHead>
                      <TableHead>Vytvořeno</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground">{t.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.placeholder_count}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(t.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Tab: Nastavení ============ */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Connection status */}
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${settings?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {settings?.connected ? 'Připojeno k Signi.com' : 'Nepřipojeno'}
                </span>
                {settings?.workspace_name && (
                  <span className="text-sm text-muted-foreground">({settings.workspace_name})</span>
                )}
              </div>

              {/* API Key */}
              <div className="max-w-md space-y-2">
                <Label htmlFor="api-key">Signi API klíč</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder={settings?.api_key_configured ? `Nakonfigurováno (****${settings.api_key_last4})` : 'Zadejte API klíč'}
                />
                <p className="text-xs text-muted-foreground">
                  API klíč získáte v nastavení Vašeho Signi.com účtu.
                </p>
              </div>

              {/* Settings message */}
              {settingsMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  settingsMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {settingsMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  )}
                  {settingsMessage.text}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveSettings} disabled={!apiKeyInput.trim() || savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Uložit
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Testovat připojení
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ New Contract Dialog (Wizard) ============ */}
      <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) { setShowNewDialog(false); resetWizard() } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Nová smlouva
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Krok {wizardStep} ze 4
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step <= wizardStep ? 'bg-violet-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Dokument */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Dokument</h3>
              <div className="space-y-2">
                <Label htmlFor="doc-name">Název dokumentu *</Label>
                <Input
                  id="doc-name"
                  value={newContract.document_name}
                  onChange={e => setNewContract(prev => ({ ...prev, document_name: e.target.value }))}
                  placeholder="např. Mandátní smlouva - Firma s.r.o."
                />
              </div>
              <div className="space-y-2">
                <Label>Typ dokumentu</Label>
                <Select
                  value={newContract.document_type}
                  onValueChange={v => setNewContract(prev => ({ ...prev, document_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Typ podpisu</Label>
                <Select
                  value={newContract.signature_type}
                  onValueChange={v => setNewContract(prev => ({ ...prev, signature_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIGNATURE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {templates.length > 0 && (
                <div className="space-y-2">
                  <Label>Šablona (volitelné)</Label>
                  <Select
                    value={newContract.template_id}
                    onValueChange={v => setNewContract(prev => ({ ...prev, template_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bez šablony" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bez šablony</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Podepisující */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Podepisující</h3>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {newContract.signers.map((signer, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-3 relative">
                    {newContract.signers.length > 1 && (
                      <button
                        onClick={() => removeSigner(idx)}
                        className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Odebrat"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Podepisující {idx + 1}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Jméno *</Label>
                        <Input
                          value={signer.name}
                          onChange={e => updateSigner(idx, 'name', e.target.value)}
                          placeholder="Jan Novák"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">E-mail *</Label>
                        <Input
                          type="email"
                          value={signer.email}
                          onChange={e => updateSigner(idx, 'email', e.target.value)}
                          placeholder="jan@firma.cz"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Telefon</Label>
                        <Input
                          value={signer.phone || ''}
                          onChange={e => updateSigner(idx, 'phone', e.target.value)}
                          placeholder="+420 ..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select
                          value={signer.role}
                          onValueChange={v => updateSigner(idx, 'role', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sign">Podepsat</SelectItem>
                            <SelectItem value="approve">Schválit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addSigner}>
                <Plus className="mr-2 h-3 w-3" />
                Přidat podepisujícího
              </Button>
            </div>
          )}

          {/* Step 3: Poznámka */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Poznámka</h3>
              <div className="space-y-2">
                <Label htmlFor="note">Poznámka pro podepisující (volitelné)</Label>
                <textarea
                  id="note"
                  value={newContract.note}
                  onChange={e => setNewContract(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Volitelná poznámka k dokumentu..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Step 4: Souhrn */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium">Souhrn</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Název:</span>
                  <span className="font-medium">{newContract.document_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Typ:</span>
                  <span>{DOC_TYPE_LABELS[newContract.document_type]}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Podpis:</span>
                  <span>{SIGNATURE_TYPE_LABELS[newContract.signature_type]}</span>
                </div>
                {newContract.template_id && newContract.template_id !== 'none' && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Šablona:</span>
                    <span>{templates.find(t => t.id === newContract.template_id)?.name || '-'}</span>
                  </div>
                )}
                <div className="py-2 border-b">
                  <span className="text-muted-foreground">Podepisující:</span>
                  <ul className="mt-2 space-y-1">
                    {newContract.signers.filter(s => s.name && s.email).map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">{s.email}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {s.role === 'sign' ? 'Podepsat' : 'Schválit'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                {newContract.note && (
                  <div className="py-2">
                    <span className="text-muted-foreground">Poznámka:</span>
                    <p className="mt-1 text-sm">{newContract.note}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            <div>
              {wizardStep > 1 && (
                <Button variant="ghost" onClick={() => setWizardStep(s => s - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Zpět
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setShowNewDialog(false); resetWizard() }}>
                Zrušit
              </Button>
              {wizardStep < 4 ? (
                <Button
                  onClick={() => setWizardStep(s => s + 1)}
                  disabled={
                    (wizardStep === 1 && !canProceedStep1) ||
                    (wizardStep === 2 && !canProceedStep2)
                  }
                >
                  Další
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreateContract} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vytvořit
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
