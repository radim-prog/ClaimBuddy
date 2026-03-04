'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Save, Building2, FileText, ArrowDownLeft, ArrowUpRight, RefreshCw, Bell, MessageCircle, Mail, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useClientUser } from '@/lib/contexts/client-user-context'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'company' | 'invoices' | 'notifications'

interface Invoice {
  id: string
  company_id: string
  invoice_number: string
  type: string
  partner_name: string
  amount: number
  currency: string
  issue_date: string
  due_date: string
  status: string
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
}

const statusLabels: Record<string, string> = {
  paid: 'Zaplaceno',
  unpaid: 'Nezaplaceno',
  overdue: 'Po splatnosti',
  draft: 'Koncept',
  sent: 'Odesláno',
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(amount)
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'company', label: 'Firma', icon: Building2 },
    { id: 'invoices', label: 'Faktury', icon: FileText },
    { id: 'notifications', label: 'Upozornění', icon: Bell },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Můj účet</h1>
        <p className="text-muted-foreground">Spravujte svůj profil, firmu a faktury</p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-soft-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'company' && <CompanyTab />}
      {activeTab === 'invoices' && <InvoicesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
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
    } catch (err: any) {
      toast.error(err.message || 'Chyba při ukládání')
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
    } catch (err: any) {
      toast.error(err.message || 'Chyba při změně hesla')
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
    <div className="space-y-6 max-w-2xl">
      <Card>
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

      <Card>
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
  const { companies, loading } = useClientUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium font-display">Žádné firmy</p>
            <p className="mt-1 text-sm">Kontaktujte svého účetního.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Building2 className="h-5 w-5 text-blue-600" />
              {company.name}
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                    company.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {company.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [])

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(i => filter === 'income' ? i.type === 'issued' : i.type === 'received')

  const totalIncome = invoices.filter(i => i.type === 'issued').reduce((s, i) => s + (i.amount || 0), 0)
  const totalExpense = invoices.filter(i => i.type === 'received').reduce((s, i) => s + (i.amount || 0), 0)

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="cursor-pointer card-hover shadow-soft-sm" onClick={() => setFilter('all')}>
          <CardContent className="pt-4 pb-3 p-6">
            <p className="text-xs text-muted-foreground">Celkem faktur</p>
            <p className="text-2xl font-bold font-display">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer card-hover shadow-soft-sm" onClick={() => setFilter('income')}>
          <CardContent className="pt-4 pb-3 p-6">
            <p className="text-xs text-muted-foreground">Vydané (příjmy)</p>
            <p className="text-2xl font-bold font-display text-green-600">{formatAmount(totalIncome, 'CZK')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer card-hover shadow-soft-sm" onClick={() => setFilter('expense')}>
          <CardContent className="pt-4 pb-3 p-6">
            <p className="text-xs text-muted-foreground">Přijaté (náklady)</p>
            <p className="text-2xl font-bold font-display text-red-600">{formatAmount(totalExpense, 'CZK')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'all' ? 'Vše' : f === 'income' ? 'Vydané' : 'Přijaté'}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={fetchInvoices} className="ml-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Zatím nemáte žádné faktury</p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(inv => (
            <Card key={inv.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    inv.type === 'issued' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'
                  }`}>
                    {inv.type === 'issued'
                      ? <ArrowUpRight className="h-5 w-5 text-green-600" />
                      : <ArrowDownLeft className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {inv.invoice_number} — {inv.partner_name || 'Neuvedeno'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{inv.type === 'issued' ? 'Vydaná' : 'Přijatá'}</span>
                      <span>·</span>
                      <span>{new Date(inv.issue_date).toLocaleDateString('cs-CZ')}</span>
                      {inv.due_date && (
                        <>
                          <span>·</span>
                          <span>Splatnost {new Date(inv.due_date).toLocaleDateString('cs-CZ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold ${
                      inv.type === 'issued' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatAmount(inv.amount || 0, inv.currency)}
                    </span>
                    <Badge className={cn('rounded-md', statusColors[inv.status] || 'bg-gray-100 text-gray-800')}>
                      {statusLabels[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface NotificationPrefs {
  email: boolean
  telegram: boolean
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
    types: {
      missing_document_tax_impact: true,
      invoice_due_reminder: true,
      monthly_summary: true,
    },
  })
  const [telegramChatId, setTelegramChatId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/client/notification-preferences')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.preferences) setPrefs(data.preferences)
        if (data?.telegram_chat_id) setTelegramChatId(data.telegram_chat_id)
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
    <div className="space-y-6 max-w-2xl">
      {/* Channels */}
      <Card>
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
        </CardContent>
      </Card>

      {/* Notification types */}
      <Card>
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

      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Ukládám...' : 'Uložit nastavení'}
      </Button>
    </div>
  )
}
