'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, Save, Building2, Bell, MessageCircle, Mail, Loader2, Clock, Inbox, FileText, FileSpreadsheet, Receipt, File, Copy, CheckCircle2, AlertCircle, Smartphone, Shield, Download, Trash2, Pencil } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { AddCompanyDialog } from '@/components/client/add-company-dialog'
import { CompanyEditDialog } from '@/components/client/company-edit-dialog'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'

export default function AccountPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Nastavení</h1>
        <p className="text-muted-foreground">Spravujte svůj profil a nastavení</p>
      </div>
      <Tabs defaultValue="account">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Můj účet</TabsTrigger>
          <TabsTrigger value="companies">Moje firmy</TabsTrigger>
          <TabsTrigger value="notifications">Upozornění</TabsTrigger>
          <TabsTrigger value="privacy">Ochrana údajů</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-6 mt-6">
          <ProfileTab />
          <DefaultCompanySection />
        </TabsContent>
        <TabsContent value="companies" className="mt-6">
          <CompanyTab />
        </TabsContent>
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <DocumentInboxTab />
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="privacy" className="mt-6">
          <DataProtectionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProfileTab() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loginName, setLoginName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/client/profile')
      .then(r => r.json())
      .then(data => {
        setName(data.name || '')
        setEmail(data.email || '')
        setLoginName(data.login_name || '')
      })
      .catch(() => toast.error('Nepodařilo se načíst profil'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profil uložen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Hesla se neshodují')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Heslo změněno')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při změně hesla')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <User className="h-5 w-5" />
            Osobní údaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="login">Přihlašovací jméno</Label>
            <Input id="login" value={loginName} disabled className="bg-muted h-11" />
            <p className="text-xs text-muted-foreground mt-1">Nelze změnit</p>
          </div>
          <div>
            <Label htmlFor="name">Jméno</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Lock className="h-5 w-5" />
            Změna hesla
          </CardTitle>
          <CardDescription>Vyplňte pouze pokud chcete heslo změnit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current">Současné heslo</Label>
            <Input id="current" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label htmlFor="new">Nové heslo</Label>
            <Input id="new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-11" />
          </div>
          <div>
            <Label htmlFor="confirm">Potvrdit nové heslo</Label>
            <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-11" />
          </div>
          <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword} variant="outline">
            <Lock className="mr-2 h-4 w-4" />
            {saving ? 'Měním...' : 'Změnit heslo'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function DefaultCompanySection() {
  const { companies, setDefaultCompany } = useClientUser()
  const [defaultId, setDefaultId] = useState<string>('')

  useEffect(() => {
    const saved = localStorage.getItem('default_company_id')
    setDefaultId(saved || '')
  }, [])

  if (companies.length <= 1) return null

  const handleChange = (value: string) => {
    setDefaultId(value)
    if (value) {
      setDefaultCompany(value)
    } else {
      localStorage.removeItem('default_company_id')
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-display">
          <Building2 className="h-5 w-5" />
          Výchozí firma
        </CardTitle>
        <CardDescription>Firma, která se automaticky vybere po přihlášení</CardDescription>
      </CardHeader>
      <CardContent>
        <select
          value={defaultId}
          onChange={e => handleChange(e.target.value)}
          className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Žádná — vždy zobrazit výběr</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </CardContent>
    </Card>
  )
}

function CompanyTab() {
  const { companies, loading, refetch, hiddenCompanyIds, toggleCompanyVisibility } = useClientUser()
  const [editCompany, setEditCompany] = useState<typeof companies[0] | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display">Moje firmy</h2>
        <AddCompanyDialog onCompanyAdded={refetch} />
      </div>

      {companies.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium font-display">Žádné firmy</p>
              <p className="mt-1 text-sm">Přidejte svou první firmu pomocí IČO.</p>
              <div className="mt-4">
                <AddCompanyDialog onCompanyAdded={refetch} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {companies.map(company => (
            <div key={company.id} className="relative p-4 rounded-xl border hover:shadow-sm">
              <button onClick={() => setEditCompany(company)} className="absolute top-3 right-3">
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">{company.name}</p>
                  <p className="text-xs text-muted-foreground">IČO: {company.ico}</p>
                </div>
              </div>
              {hiddenCompanyIds.has(company.id) && (
                <Badge variant="secondary" className="mt-2">Skrytá</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <CompanyEditDialog
        company={editCompany}
        hidden={editCompany ? hiddenCompanyIds.has(editCompany.id) : false}
        onToggleHidden={toggleCompanyVisibility}
        open={!!editCompany}
        onOpenChange={(open) => { if (!open) setEditCompany(null) }}
      />
    </div>
  )
}

interface InboxItem {
  id: string
  filename: string
  mime_type: string
  from_name: string | null
  subject: string | null
  received_at: string | null
  status: string
  created_at: string
  category: string
  category_label: string
  category_confidence: string
}

const CATEGORY_ICON: Record<string, typeof FileText> = {
  expense_invoice: FileText,
  bank_statement: FileSpreadsheet,
  receipt: Receipt,
  other: File,
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Čeká', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  processing: { label: 'Zpracovává se', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  imported: { label: 'Importováno', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Chyba', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  ignored: { label: 'Ignorováno', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' },
}

function DocumentInboxTab() {
  const { selectedCompany } = useClientUser()
  const { isLocked, loading: planLoading } = usePlanFeatures()
  const [inboxEmail, setInboxEmail] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const locked = isLocked('document_inbox')

  useEffect(() => {
    if (!selectedCompany?.id || locked) {
      setLoading(false)
      return
    }

    fetch(`/api/client/document-inbox?company_id=${selectedCompany.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.inbox) {
          setInboxEmail(data.inbox.email_address)
          setIsActive(data.inbox.is_active)
        }
        if (data?.items) setItems(data.items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCompany?.id, locked])

  const handleCopy = async () => {
    if (!inboxEmail) return
    try {
      await navigator.clipboard.writeText(inboxEmail)
      setCopied(true)
      toast.success('Email zkopírován')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Nepodařilo se zkopírovat')
    }
  }

  if (planLoading || loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (locked) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Inbox className="h-5 w-5" />
            Sběrný email pro doklady
          </CardTitle>
          <CardDescription>Posílejte doklady emailem — automaticky se zařadí ke správné firmě</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Tato funkce je dostupná v tarifu <span className="font-medium text-blue-600">Plus+</span> a vyšším.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href="/client/subscription">Zobrazit tarify</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selectedCompany) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Inbox className="h-5 w-5" />
            Sběrný email pro doklady
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nejprve vyberte firmu.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Inbox className="h-5 w-5" />
            Sběrný email pro doklady
          </CardTitle>
          <CardDescription>
            Posílejte faktury, výpisy a účtenky na tento email — automaticky se přiřadí k vaší firmě
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inboxEmail ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm select-all">
                  {inboxEmail}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {!isActive && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Inbox je momentálně neaktivní. Kontaktujte svého účetního.</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Podporované formáty: PDF, JPG, PNG, WEBP, HEIC, Excel</p>
                <p>Přílohy se automaticky kategorizují podle názvu souboru.</p>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Mail className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Sběrný email zatím nebyl vytvořen. Kontaktujte svého účetního pro aktivaci.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-display">Odeslané doklady</CardTitle>
            <CardDescription>Posledních {items.length} přijatých příloh</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {items.map(item => {
                const CatIcon = CATEGORY_ICON[item.category] || File
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <CatIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.category_label}</span>
                        {item.category_confidence !== 'high' && (
                          <span className="text-muted-foreground/60">({item.category_confidence === 'medium' ? 'odhad' : 'nejisté'})</span>
                        )}
                        {item.received_at && (
                          <>
                            <span>·</span>
                            <span>{new Date(item.received_at).toLocaleDateString('cs-CZ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface NotificationPrefs {
  email: boolean
  telegram: boolean
  whatsapp: boolean
  marketing_emails?: boolean
  types: {
    missing_document_tax_impact: boolean
    invoice_due_reminder: boolean
    monthly_summary: boolean
  }
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    telegram: false,
    whatsapp: false,
    types: {
      missing_document_tax_impact: true,
      invoice_due_reminder: true,
      monthly_summary: true,
    },
  })
  const [telegramChatId, setTelegramChatId] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/client/notification-preferences')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences) {
          // Merge with defaults — DB may have old flat structure without `types`
          setPrefs(prev => ({
            ...prev,
            ...data.preferences,
            types: {
              ...prev.types,
              ...(data.preferences.types || {}),
            },
          }))
        }
        if (data?.telegram_chat_id) setTelegramChatId(data.telegram_chat_id)
        if (data?.phone) setPhone(data.phone)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/client/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs,
          telegram_chat_id: telegramChatId || null,
          phone: phone || null,
        }),
      })
      if (res.ok) {
        toast.success('Nastavení uloženo')
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Uložení selhalo')
    } finally {
      setSaving(false)
    }
  }

  const updateType = (key: keyof NotificationPrefs['types'], value: boolean) => {
    setPrefs(p => ({ ...p, types: { ...p.types, [key]: value } }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Channels */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Bell className="h-5 w-5" />
            Kanály upozornění
          </CardTitle>
          <CardDescription>Zvolte jakými kanály chcete dostávat upozornění</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-muted-foreground">Upozornění na váš email</p>
              </div>
            </div>
            <Switch
              checked={prefs.email}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, email: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Telegram</p>
                <p className="text-xs text-muted-foreground">Upozornění přes Telegram bota</p>
              </div>
            </div>
            <Switch
              checked={prefs.telegram}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, telegram: checked }))}
            />
          </div>

          {prefs.telegram && (
            <div className="ml-8 space-y-2">
              <Label className="text-xs">Telegram Chat ID</Label>
              <Input
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                placeholder="Např. 123456789"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Napište /start botovi @UcetniWebAppBot a pošlete příkaz /id pro zjištění vašeho Chat ID
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Upozornění přes WhatsApp (v pracovní době)</p>
              </div>
            </div>
            <Switch
              checked={prefs.whatsapp}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, whatsapp: checked }))}
            />
          </div>

          {prefs.whatsapp && (
            <div className="ml-8 space-y-2">
              <Label className="text-xs">Telefonní číslo</Label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+420 123 456 789"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Číslo registrované ve WhatsApp. Zprávy chodí pouze v pracovní době (Po-Pá 8-18h).
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification types */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-display">Typy upozornění</CardTitle>
          <CardDescription>Zvolte o čem chcete být informováni</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Chybějící doklady + daňový dopad</p>
              <p className="text-xs text-muted-foreground">
                Upozornění na nespárované výdaje a kolik vás stojí na dani
              </p>
            </div>
            <Switch
              checked={prefs.types.missing_document_tax_impact}
              onCheckedChange={(v) => updateType('missing_document_tax_impact', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Splatnost faktur</p>
              <p className="text-xs text-muted-foreground">
                Připomínka 3 dny před splatností vydané faktury
              </p>
            </div>
            <Switch
              checked={prefs.types.invoice_due_reminder}
              onCheckedChange={(v) => updateType('invoice_due_reminder', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Měsíční přehled</p>
              <p className="text-xs text-muted-foreground">
                Souhrn příjmů, výdajů a daňového dopadu za měsíc
              </p>
            </div>
            <Switch
              checked={prefs.types.monthly_summary}
              onCheckedChange={(v) => updateType('monthly_summary', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing emails opt-out (GDPR) */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-display">Marketingové emaily</CardTitle>
          <CardDescription>GDPR: můžete se kdykoli odhlásit z marketingových emailů</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Tipy, novinky a nabídky</p>
              <p className="text-xs text-muted-foreground">
                Občasné emaily s tipy pro vaše podnikání a účetnictví
              </p>
            </div>
            <Switch
              checked={prefs.marketing_emails ?? true}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, marketing_emails: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Ukládám...' : 'Uložit nastavení'}
      </Button>
    </div>
  )
}

function DataProtectionTab() {
  const [exporting, setExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [cancelToken, setCancelToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/client/data-export')
      if (!res.ok) throw new Error('Export selhal')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `moje-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exportována')
    } catch {
      toast.error('Export se nezdařil')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletePassword) {
      toast.error('Zadejte heslo')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/client/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chyba')
      setCancelToken(data.cancel_token)
      setShowDeleteDialog(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Chyba při mazání účtu')
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyToken = async () => {
    if (!cancelToken) return
    try {
      await navigator.clipboard.writeText(cancelToken)
      setTokenCopied(true)
      toast.success('Kód zkopírován')
      setTimeout(() => setTokenCopied(false), 2000)
    } catch {
      toast.error('Nepodařilo se zkopírovat')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-display flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Ochrana údajů
      </h2>

      {/* Data export */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Download className="h-5 w-5" />
            Export osobních údajů
          </CardTitle>
          <CardDescription>
            Stáhněte si kopii všech vašich osobních údajů (čl. 20 GDPR — právo na přenositelnost údajů)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={exporting} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exportuji...' : 'Exportovat moje data'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Export obsahuje: profil, firmy, doklady, faktury, zprávy a cestovní záznamy.
          </p>
        </CardContent>
      </Card>

      {/* Account deletion */}
      <Card className="rounded-2xl border-red-200 dark:border-red-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Smazání účtu
          </CardTitle>
          <CardDescription>
            Po podání žádosti máte 30 dní na rozmyšlenou. Účetní doklady zůstanou zachovány dle zákona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cancelToken ? (
            <div className="space-y-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Žádost o smazání podána. Účet bude smazán za 30 dní.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Uložte si tento kód pro případ, že si to rozmyslíte:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 rounded-lg px-4 py-3 font-mono text-sm select-all border">
                  {cancelToken}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyToken} className="shrink-0">
                  {tokenCopied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Pro zrušení smazání navštivte{' '}
                <a href="/auth/cancel-deletion" className="text-blue-600 hover:underline">/auth/cancel-deletion</a>
                {' '}a zadejte tento kód.
              </p>
              <Button onClick={() => { window.location.href = '/auth/login' }} variant="outline" size="sm">
                Odhlásit se
              </Button>
            </div>
          ) : !showDeleteDialog ? (
            <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Smazat účet
            </Button>
          ) : (
            <div className="space-y-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Opravdu chcete smazat účet? Zadejte heslo pro potvrzení.
              </p>
              <div>
                <Label htmlFor="deletePassword" className="text-sm">Heslo</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Vaše heslo"
                  className="h-11 mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDelete} disabled={deleting || !deletePassword} variant="destructive" size="sm">
                  {deleting ? 'Mažu...' : 'Potvrdit smazání'}
                </Button>
                <Button onClick={() => { setShowDeleteDialog(false); setDeletePassword('') }} variant="outline" size="sm">
                  Zrušit
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
