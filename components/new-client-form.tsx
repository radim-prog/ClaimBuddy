'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Loader2, AlertCircle, Check } from 'lucide-react'

interface Accountant {
  id: string
  name: string
  email: string
}

interface NewClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (companyId: string) => void
  onboardingSteps?: any[] // Optional onboarding steps from setup
}

const LEGAL_FORMS = [
  { value: 'OSVČ', label: 'OSVČ (Osoba samostatně výdělečně činná)' },
  { value: 's.r.o.', label: 's.r.o. (Společnost s ručením omezeným)' },
  { value: 'a.s.', label: 'a.s. (Akciová společnost)' },
  { value: 'v.o.s.', label: 'v.o.s. (Veřejná obchodní společnost)' },
  { value: 'k.s.', label: 'k.s. (Komanditní společnost)' },
  { value: 'družstvo', label: 'Družstvo' },
]

const VAT_PERIODS = [
  { value: 'monthly', label: 'Měsíční' },
  { value: 'quarterly', label: 'Kvartální' },
]

export function NewClientForm({ open, onOpenChange, onSuccess, onboardingSteps }: NewClientFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ico: '',
    dic: '',
    legal_form: '',
    vat_payer: false,
    vat_period: '',
    street: '',
    city: '',
    zip: '',
    bank_account: '',
    email: '',
    phone: '',
    assigned_accountant_id: '',
    has_employees: false,
  })

  const [accountants, setAccountants] = useState<Accountant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null)

  // Fetch accountants for dropdown
  useEffect(() => {
    if (open) {
      fetch('/api/accountant/users')
        .then(res => res.json())
        .then(data => {
          // Filter only accountants and assistants
          const filtered = (data.users || []).filter(
            (u: any) => u.role === 'accountant' || u.role === 'assistant' || u.role === 'admin'
          )
          setAccountants(filtered)
        })
        .catch(err => console.error('Failed to fetch accountants:', err))
    }
  }, [open])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        ico: '',
        dic: '',
        legal_form: '',
        vat_payer: false,
        vat_period: '',
        street: '',
        city: '',
        zip: '',
        bank_account: '',
        email: '',
        phone: '',
        assigned_accountant_id: '',
        has_employees: false,
      })
      setError(null)
      setSuccess(false)
      setCreatedCompanyId(null)
    }
  }, [open])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (error) setError(null)
  }

  // Auto-generate DIC from IČO when IČO changes
  const handleIcoChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 8)
    setFormData(prev => ({
      ...prev,
      ico: digitsOnly,
      // Auto-fill DIC if empty and we have 8 digits
      dic: prev.dic || (digitsOnly.length === 8 ? `CZ${digitsOnly}` : prev.dic),
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Název firmy je povinný')
      return false
    }
    if (!/^\d{8}$/.test(formData.ico)) {
      setError('IČO musí obsahovat přesně 8 číslic')
      return false
    }
    if (!formData.legal_form) {
      setError('Právní forma je povinná')
      return false
    }
    if (formData.vat_payer && !formData.vat_period) {
      setError('Pro plátce DPH je nutné zadat periodicitu')
      return false
    }
    if (formData.dic && !/^CZ\d{8,10}$/.test(formData.dic)) {
      setError('DIČ musí být ve formátu CZ následované 8-10 číslicemi')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/accountant/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          ico: formData.ico,
          dic: formData.dic || null,
          legal_form: formData.legal_form,
          vat_payer: formData.vat_payer,
          vat_period: formData.vat_period || null,
          street: formData.street,
          city: formData.city,
          zip: formData.zip,
          email: formData.email || null,
          phone: formData.phone || null,
          bank_account: formData.bank_account || null,
          assigned_accountant_id: formData.assigned_accountant_id === 'none' ? null : (formData.assigned_accountant_id || null),
          has_employees: formData.has_employees,
          // Include onboarding steps if provided
          onboarding_steps: onboardingSteps,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Nepodařilo se vytvořit klienta')
      }

      setCreatedCompanyId(data.company.id)
      setSuccess(true)
      onSuccess?.(data.company.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nastala neočekávaná chyba')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // If we created a company, navigate to it after closing
    if (createdCompanyId) {
      window.location.href = `/accountant/clients/${createdCompanyId}`
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Klient byl úspěšně vytvořen!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Nový klient byl přidán do systému a je připraven pro onboarding.
            </p>
            <Button onClick={handleClose} className="mt-6 bg-purple-600 hover:bg-purple-700">
              Přejít na detail klienta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Nový klient
          </DialogTitle>
          <DialogDescription>
            Vyplňte základní údaje o novém klientovi. Klient bude automaticky přidán do onboardingu.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Company name */}
          <div className="col-span-2">
            <Label htmlFor="name" className="text-red-600">*</Label>
            <Label htmlFor="name" className="ml-1">Název firmy / Jméno</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="např. Nová s.r.o."
              disabled={loading}
            />
          </div>

          {/* IČO */}
          <div>
            <Label htmlFor="ico" className="text-red-600">*</Label>
            <Label htmlFor="ico" className="ml-1">IČO</Label>
            <Input
              id="ico"
              value={formData.ico}
              onChange={(e) => handleIcoChange(e.target.value)}
              placeholder="12345678"
              maxLength={8}
              disabled={loading}
            />
          </div>

          {/* DIČ */}
          <div>
            <Label htmlFor="dic">DIČ</Label>
            <Input
              id="dic"
              value={formData.dic}
              onChange={(e) => handleInputChange('dic', e.target.value)}
              placeholder="CZ12345678"
              disabled={loading}
            />
          </div>

          {/* Legal form */}
          <div>
            <Label className="text-red-600">*</Label>
            <Label className="ml-1">Právní forma</Label>
            <Select
              value={formData.legal_form}
              onValueChange={(value) => handleInputChange('legal_form', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte právní formu" />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_FORMS.map((form) => (
                  <SelectItem key={form.value} value={form.value}>
                    {form.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned accountant */}
          <div>
            <Label>Přiřazený účetní</Label>
            <Select
              value={formData.assigned_accountant_id}
              onValueChange={(value) => handleInputChange('assigned_accountant_id', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte účetního" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nepřiřazeno</SelectItem>
                {accountants.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VAT payer checkbox */}
          <div className="col-span-2 flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vat_payer"
                checked={formData.vat_payer}
                onCheckedChange={(checked) => {
                  handleInputChange('vat_payer', checked === true)
                  if (!checked) handleInputChange('vat_period', '')
                }}
                disabled={loading}
              />
              <Label htmlFor="vat_payer" className="cursor-pointer">
                Plátce DPH
              </Label>
            </div>

            {formData.vat_payer && (
              <div className="flex items-center gap-2">
                <Label className="text-red-600">*</Label>
                <Label>Periodicita:</Label>
                <Select
                  value={formData.vat_period}
                  onValueChange={(value) => handleInputChange('vat_period', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Vyberte" />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2 ml-auto">
              <Checkbox
                id="has_employees"
                checked={formData.has_employees}
                onCheckedChange={(checked) => handleInputChange('has_employees', checked === true)}
                disabled={loading}
              />
              <Label htmlFor="has_employees" className="cursor-pointer">
                Má zaměstnance
              </Label>
            </div>
          </div>

          {/* Address */}
          <div className="col-span-2 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Adresa
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="street">Ulice a č.p.</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Hlavní 123"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="zip">PSČ</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="10000"
                  disabled={loading}
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="city">Město</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Praha"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="col-span-2 border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Kontaktní údaje
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@firma.cz"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+420 123 456 789"
                  disabled={loading}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="bank_account">Bankovní účet</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => handleInputChange('bank_account', e.target.value)}
                  placeholder="123456789/0100"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vytvářím...
              </>
            ) : (
              'Vytvořit klienta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
