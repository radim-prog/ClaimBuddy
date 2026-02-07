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
import { Save, X } from 'lucide-react'
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
  employee_count: number
  data_box: { id: string; login?: string } | null
  phone?: string
  email?: string
  status?: string
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
      // V produkci: await fetch(`/api/accountant/companies/${company.id}`, { method: 'PATCH', body: JSON.stringify(formData) })
      // Pro demo simulujeme úspěšné uložení
      await new Promise(resolve => setTimeout(resolve, 500))
      onSave(formData)
      toast.success('Údaje klienta byly uloženy')
      onOpenChange(false)
    } catch (error) {
      toast.error('Chyba při ukládání')
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
              <Label htmlFor="status">Stav klienta</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktivní</SelectItem>
                  <SelectItem value="inactive">Neaktivní</SelectItem>
                  <SelectItem value="onboarding">V onboardingu</SelectItem>
                </SelectContent>
              </Select>
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
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
