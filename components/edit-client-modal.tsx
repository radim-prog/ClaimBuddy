'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, X, Check, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

type Company = {
  id: string
  name: string
  group_name: string | null
  ico: string
  dic: string | null
  vat_payer: boolean
  vat_period: 'monthly' | 'quarterly' | null
  legal_form: string
  street: string | null
  city: string | null
  zip: string | null
  bank_account?: string | null
  health_insurance_company: string | null
  has_employees: boolean
  monthly_reporting?: boolean
  employee_count: number
  data_box: { id: string; login?: string } | null
  phone?: string
  email?: string
  status?: string
  accounting_start_date?: string | null
  managing_director?: string | null
  income_invoice_source?: string | null
}

type EditClientModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  company: Company
  onSave: (updatedCompany: Company) => void
}

export function EditClientModal({ open, onOpenChange, company, onSave }: EditClientModalProps) {
  const [formData, setFormData] = useState<Company>(company)
  const [saving, setSaving] = useState(false)

  // Reset form data when company changes
  useEffect(() => {
    setFormData(company)
  }, [company])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/accountant/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': 'accountant-1' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Chyba při ukládání')
      }
      onSave(formData)
      toast.success('Údaje klienta byly uloženy')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upravit údaje klienta</DialogTitle>
          <DialogDescription>
            Změňte údaje klienta a klikněte na Uložit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Základní údaje */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Základní údaje</h3>

            {/* Status Toggle - prominent at top */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              <Label className="text-sm font-medium mb-2 block">Stav klienta</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'active' })}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    formData.status === 'active' || !formData.status
                      ? 'bg-green-100 text-green-700 border-2 border-green-500 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Aktivní
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'inactive' })}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    formData.status === 'inactive'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Neaktivní
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'onboarding' })}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    formData.status === 'onboarding'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Nový
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Název firmy *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="group_name">Skupina</Label>
                <Input
                  id="group_name"
                  value={formData.group_name || ''}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value || null })}
                  placeholder="Např. Holding ABC"
                />
              </div>
            </div>



            <div>
              <Label htmlFor="managing_director">Jednatel</Label>
              <Input
                id="managing_director"
                value={formData.managing_director || ''}
                onChange={(e) => setFormData({ ...formData, managing_director: e.target.value || null })}
                placeholder="Jméno jednatele"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ico">IČO *</Label>
                <Input
                  id="ico"
                  value={formData.ico}
                  onChange={(e) => setFormData({ ...formData, ico: e.target.value })}
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label htmlFor="dic">DIČ</Label>
                <Input
                  id="dic"
                  value={formData.dic || ''}
                  onChange={(e) => setFormData({ ...formData, dic: e.target.value || null })}
                  placeholder="CZ12345678"
                />
              </div>
              <div>
                <Label htmlFor="legal_form">Právní forma</Label>
                <Select
                  value={formData.legal_form}
                  onValueChange={(value) => setFormData({ ...formData, legal_form: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s.r.o.">s.r.o.</SelectItem>
                    <SelectItem value="a.s.">a.s.</SelectItem>
                    <SelectItem value="OSVČ">OSVČ</SelectItem>
                    <SelectItem value="v.o.s.">v.o.s.</SelectItem>
                    <SelectItem value="k.s.">k.s.</SelectItem>
                    <SelectItem value="z.s.">z.s.</SelectItem>
                    <SelectItem value="družstvo">družstvo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Účetní datum zahájení */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Datum zahájení spolupráce</h3>
            <div>
              <Label htmlFor="accounting_start_date">Od kdy vedeme účetnictví</Label>
              <Input
                id="accounting_start_date"
                type="date"
                value={formData.accounting_start_date || ''}
                onChange={(e) => setFormData({ ...formData, accounting_start_date: e.target.value || null })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Měsíce před tímto datem se nebudou hlásit jako chybějící doklady
              </p>
            </div>
          </div>

          {/* DPH */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">DPH</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vat_payer">Plátce DPH</Label>
                <Select
                  value={formData.vat_payer ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData({ ...formData, vat_payer: value === 'yes' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ano</SelectItem>
                    <SelectItem value="no">Ne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.vat_payer && (
                <div>
                  <Label htmlFor="vat_period">Zdaňovací období DPH</Label>
                  <Select
                    value={formData.vat_period || 'monthly'}
                    onValueChange={(value) => setFormData({ ...formData, vat_period: value as 'monthly' | 'quarterly' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Měsíční</SelectItem>
                      <SelectItem value="quarterly">Kvartální</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Měsíční reporting */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Měsíční reporting</h3>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <Label className="text-sm font-medium">Zobrazovat v měsíční matici podkladů</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Neplátci DPH (FO) typicky nepotřebují měsíční reporting
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, monthly_reporting: !formData.monthly_reporting })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.monthly_reporting !== false
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  formData.monthly_reporting !== false ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Fakturace */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Fakturace</h3>
            <div>
              <Label htmlFor="income_invoice_source">Zdroj příjmových faktur</Label>
              <Select
                value={formData.income_invoice_source || 'unknown'}
                onValueChange={(value) => setFormData({ ...formData, income_invoice_source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Vystavujeme v systému</SelectItem>
                  <SelectItem value="external">Jiný fakturační systém</SelectItem>
                  <SelectItem value="parent_company">Vystavuje mateřská společnost</SelectItem>
                  <SelectItem value="none">Nefakturuje</SelectItem>
                  <SelectItem value="unknown">Neznámý</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ovlivňuje kontrolu příjmových faktur v uzávěrkách
              </p>
            </div>
          </div>

          {/* Adresa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Adresa sídla</h3>

            <div>
              <Label htmlFor="street">Ulice a číslo</Label>
              <Input
                id="street"
                value={formData.street || ''}
                onChange={(e) => setFormData({ ...formData, street: e.target.value || null })}
                placeholder="Václavské náměstí 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Město</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value || null })}
                  placeholder="Praha"
                />
              </div>
              <div>
                <Label htmlFor="zip">PSČ</Label>
                <Input
                  id="zip"
                  value={formData.zip || ''}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value || null })}
                  placeholder="110 00"
                />
              </div>
            </div>
          </div>

          {/* Kontaktní údaje */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Kontaktní údaje</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+420 123 456 789"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@firma.cz"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="data_box">Datová schránka</Label>
              <Input
                id="data_box"
                value={formData.data_box?.id || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  data_box: e.target.value ? { id: e.target.value, login: formData.data_box?.login } : null
                })}
                placeholder="abc1234"
              />
            </div>
          </div>

          {/* Bankovní údaje */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Bankovní spojení</h3>

            <div>
              <Label htmlFor="bank_account">Číslo účtu</Label>
              <Input
                id="bank_account"
                value={formData.bank_account || ''}
                onChange={(e) => setFormData({ ...formData, bank_account: e.target.value || null })}
                placeholder="123456789/0800"
              />
            </div>
          </div>

          {/* Zaměstnanci */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Zaměstnanci</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="has_employees">Má zaměstnance</Label>
                <Select
                  value={formData.has_employees ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData({ ...formData, has_employees: value === 'yes' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Ano</SelectItem>
                    <SelectItem value="no">Ne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.has_employees && (
                <div>
                  <Label htmlFor="employee_count">Počet zaměstnanců</Label>
                  <Input
                    id="employee_count"
                    type="number"
                    value={formData.employee_count || 0}
                    onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              )}
            </div>

            {formData.has_employees && (
              <div>
                <Label htmlFor="health_insurance_company">Zdravotní pojišťovna</Label>
                <Select
                  value={formData.health_insurance_company || ''}
                  onValueChange={(value) => setFormData({ ...formData, health_insurance_company: value || null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte pojišťovnu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="111">VZP (111)</SelectItem>
                    <SelectItem value="201">VoZP (201)</SelectItem>
                    <SelectItem value="205">ČPZP (205)</SelectItem>
                    <SelectItem value="207">OZP (207)</SelectItem>
                    <SelectItem value="209">ZPŠ (209)</SelectItem>
                    <SelectItem value="211">ZPMV (211)</SelectItem>
                    <SelectItem value="213">RBP (213)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
