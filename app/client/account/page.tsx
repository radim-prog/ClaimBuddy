'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, Save, Building2, Bell, MessageCircle, Mail, Loader2, Clock, Inbox, FileText, FileSpreadsheet, Receipt, File, Copy, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { AddCompanyDialog } from '@/components/client/add-company-dialog'
import { usePlanFeatures } from '@/lib/hooks/use-plan-features'

export default function AccountPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Můj účet</h1>
        <p className="text-muted-foreground">Spravujte svůj profil a nastavení</p>
      </div>
      <ProfileTab />
      <CompanyTab />
      <DocumentInboxTab />
      <NotificationsTab />
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

function CompanyTab() {
  const { companies, loading, refetch } = useClientUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Aktivní', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
      case 'pending_review': return { text: 'Čeká na schválení', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' }
      case 'onboarding': return { text: 'Onboarding', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' }
      default: return { text: 'Neaktivní', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }
    }
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
        companies.map((company) => {
          const status = statusLabel(company.status)
          return (
            <Card key={company.id} className={`rounded-2xl ${company.status === 'pending_review' ? 'border-amber-200 dark:border-amber-800' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  {company.name}
                  {company.status === 'pending_review' && (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">IČO</dt>
                    <dd className="font-medium">{company.ico}</dd>
                  </div>
                  {company.dic && (
                    <div>
                      <dt className="text-muted-foreground">DIČ</dt>
                      <dd className="font-medium">{company.dic}</dd>
                    </div>
                  )}
                  {company.managing_director && (
                    <div>
                      <dt className="text-muted-foreground">Jednatel</dt>
                      <dd className="font-medium">{company.managing_director}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Právní forma</dt>
                    <dd className="font-medium">{company.legal_form}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Plátce DPH</dt>
                    <dd className="font-medium">{company.vat_payer ? 'Ano' : 'Ne'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Zaměstnanci</dt>
                    <dd className="font-medium">{company.has_employees ? 'Ano' : 'Ne'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${status.cls}`}>
                        {status.text}
                      </span>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )
        })
      )}
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
