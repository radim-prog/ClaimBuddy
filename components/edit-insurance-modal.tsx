'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Shield,
  Heart,
  Wallet,
  Building2,
  Car,
  Users,
  Globe,
  Home,
  Briefcase,
  Save,
  X,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Insurance,
  InsuranceCategory,
  InsuranceStatus,
  PaymentFrequency,
  INSURANCE_CATEGORY_LABELS,
  INSURANCE_CATEGORY_GROUPS,
  INSURANCE_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  INSURANCE_PROVIDERS,
  PENSION_PROVIDERS,
  calculateAnnualPremium,
  isTaxDeductibleCategory,
} from '@/lib/types/insurance'
import { Asset } from '@/lib/types/asset'
import { Employee } from '@/lib/types/employee'

type EditInsuranceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  insurance: Insurance | null
  companyId: string
  assets?: Asset[]
  employees?: Employee[]
  onSave: (insurance: Insurance) => void
}

const CATEGORY_ICONS: Record<InsuranceCategory, React.ReactNode> = {
  life_insurance: <Heart className="h-4 w-4" />,
  pension_savings: <Wallet className="h-4 w-4" />,
  long_term_care: <Heart className="h-4 w-4" />,
  dip: <Wallet className="h-4 w-4" />,
  liability_business: <Building2 className="h-4 w-4" />,
  liability_professional: <Briefcase className="h-4 w-4" />,
  property_business: <Building2 className="h-4 w-4" />,
  vehicle: <Car className="h-4 w-4" />,
  employee_statutory: <Users className="h-4 w-4" />,
  employee_supplementary: <Users className="h-4 w-4" />,
  business_interruption: <Building2 className="h-4 w-4" />,
  cyber: <Globe className="h-4 w-4" />,
  receivables: <Briefcase className="h-4 w-4" />,
  property_personal: <Home className="h-4 w-4" />,
  household: <Home className="h-4 w-4" />,
  accident: <Shield className="h-4 w-4" />,
  travel: <Globe className="h-4 w-4" />,
  other: <Shield className="h-4 w-4" />,
}

export function EditInsuranceModal({
  open,
  onOpenChange,
  insurance,
  companyId,
  assets = [],
  employees = [],
  onSave,
}: EditInsuranceModalProps) {
  const isNew = !insurance
  const [saving, setSaving] = useState(false)

  // Základní údaje
  const [category, setCategory] = useState<InsuranceCategory>('life_insurance')
  const [provider, setProvider] = useState('')
  const [contractNumber, setContractNumber] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<InsuranceStatus>('active')

  // Předmět pojištění
  const [insuredSubject, setInsuredSubject] = useState('')
  const [insuredPerson, setInsuredPerson] = useState('')

  // Finanční údaje
  const [premiumAmount, setPremiumAmount] = useState('')
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly')
  const [coverageLimit, setCoverageLimit] = useState('')
  const [deductible, setDeductible] = useState('')

  // Daňové
  const [isTaxDeductible, setIsTaxDeductible] = useState(false)
  const [taxDeductibleAmount, setTaxDeductibleAmount] = useState('')

  // Termíny
  const [contractDate, setContractDate] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [nextPaymentDate, setNextPaymentDate] = useState('')

  // Vazby
  const [linkedAssetId, setLinkedAssetId] = useState('')
  const [linkedEmployeeId, setLinkedEmployeeId] = useState('')

  // Poznámky
  const [notes, setNotes] = useState('')

  // Pomocné funkce
  const getProvidersList = () => {
    if (category === 'pension_savings') {
      return PENSION_PROVIDERS
    }
    return INSURANCE_PROVIDERS
  }

  // Automaticky nastavit daňovou odečitatelnost podle kategorie
  useEffect(() => {
    if (isNew) {
      setIsTaxDeductible(isTaxDeductibleCategory(category))
    }
  }, [category, isNew])

  // Inicializace při otevření
  useEffect(() => {
    if (open) {
      if (insurance) {
        // Editace existujícího
        setCategory(insurance.category)
        setProvider(insurance.provider)
        setContractNumber(insurance.contract_number)
        setName(insurance.name)
        setStatus(insurance.status)
        setInsuredSubject(insurance.insured_subject)
        setInsuredPerson(insurance.insured_person || '')
        setPremiumAmount(insurance.premium_amount.toString())
        setPaymentFrequency(insurance.payment_frequency)
        setCoverageLimit(insurance.coverage_limit?.toString() || '')
        setDeductible(insurance.deductible?.toString() || '')
        setIsTaxDeductible(insurance.is_tax_deductible)
        setTaxDeductibleAmount(insurance.tax_deductible_amount?.toString() || '')
        setContractDate(insurance.contract_date)
        setEffectiveDate(insurance.effective_date)
        setAnniversaryDate(insurance.anniversary_date)
        setExpiryDate(insurance.expiry_date || '')
        setNextPaymentDate(insurance.next_payment_date || '')
        setLinkedAssetId(insurance.linked_asset_id || '')
        setLinkedEmployeeId(insurance.linked_employee_id || '')
        setNotes(insurance.notes || '')
      } else {
        // Reset pro nový záznam
        setCategory('life_insurance')
        setProvider('')
        setContractNumber('')
        setName('')
        setStatus('active')
        setInsuredSubject('')
        setInsuredPerson('')
        setPremiumAmount('')
        setPaymentFrequency('monthly')
        setCoverageLimit('')
        setDeductible('')
        setIsTaxDeductible(true) // životní je defaultně tax deductible
        setTaxDeductibleAmount('')
        setContractDate('')
        setEffectiveDate('')
        setAnniversaryDate('')
        setExpiryDate('')
        setNextPaymentDate('')
        setLinkedAssetId('')
        setLinkedEmployeeId('')
        setNotes('')
      }
    }
  }, [open, insurance])

  // Výpočet ročního pojistného
  const calculatedAnnualPremium = premiumAmount
    ? calculateAnnualPremium(parseFloat(premiumAmount), paymentFrequency)
    : 0

  const handleSave = async () => {
    // Validace
    if (!provider) {
      toast.error('Vyberte poskytovatele')
      return
    }
    if (!contractNumber) {
      toast.error('Vyplňte číslo smlouvy')
      return
    }
    if (!premiumAmount || parseFloat(premiumAmount) <= 0) {
      toast.error('Vyplňte platnou částku pojistného')
      return
    }
    if (!effectiveDate) {
      toast.error('Vyplňte datum účinnosti')
      return
    }
    if (!anniversaryDate) {
      toast.error('Vyplňte datum výročí')
      return
    }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const newInsurance: Insurance = {
        id: insurance?.id || `insurance-${Date.now()}`,
        company_id: companyId,
        category,
        provider,
        contract_number: contractNumber,
        name: name || INSURANCE_CATEGORY_LABELS[category],
        insured_subject: insuredSubject,
        insured_person: insuredPerson || undefined,
        premium_amount: parseFloat(premiumAmount),
        payment_frequency: paymentFrequency,
        annual_premium: calculatedAnnualPremium,
        coverage_limit: coverageLimit ? parseFloat(coverageLimit) : undefined,
        deductible: deductible ? parseFloat(deductible) : undefined,
        is_tax_deductible: isTaxDeductible,
        tax_deductible_amount: taxDeductibleAmount ? parseFloat(taxDeductibleAmount) : undefined,
        contract_date: contractDate || effectiveDate,
        effective_date: effectiveDate,
        anniversary_date: anniversaryDate,
        expiry_date: expiryDate || undefined,
        next_payment_date: nextPaymentDate || undefined,
        status,
        linked_asset_id: linkedAssetId || undefined,
        linked_employee_id: linkedEmployeeId || undefined,
        notes: notes || undefined,
        created_at: insurance?.created_at || now,
        updated_at: now,
      }

      await onSave(newInsurance)
      toast.success(isNew ? 'Pojištění bylo přidáno' : 'Pojištění bylo aktualizováno')
      onOpenChange(false)
    } catch (error) {
      toast.error('Nepodařilo se uložit pojištění')
    } finally {
      setSaving(false)
    }
  }

  // Pomocná funkce pro zobrazení skupin kategorií
  const renderCategoryOptions = () => {
    const options: React.ReactNode[] = []

    Object.entries(INSURANCE_CATEGORY_GROUPS).forEach(([groupKey, group]) => {
      options.push(
        <div key={groupKey} className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
          {group.label}
        </div>
      )
      group.categories.forEach(cat => {
        options.push(
          <SelectItem key={cat} value={cat}>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[cat]}
              <span>{INSURANCE_CATEGORY_LABELS[cat]}</span>
            </div>
          </SelectItem>
        )
      })
    })

    return options
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isNew ? 'Přidat pojištění/smlouvu' : 'Upravit pojištění/smlouvu'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Kategorie */}
          <div className="space-y-2">
            <Label>Kategorie *</Label>
            <Select value={category} onValueChange={(value: InsuranceCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[category]}
                    <span>{INSURANCE_CATEGORY_LABELS[category]}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {renderCategoryOptions()}
              </SelectContent>
            </Select>
            {isTaxDeductibleCategory(category) && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Tato kategorie je daňově odečitatelná (max. 48 000 Kč/rok)
              </p>
            )}
          </div>

          {/* Poskytovatel a číslo smlouvy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Poskytovatel *</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte poskytovatele" />
                </SelectTrigger>
                <SelectContent>
                  {getProvidersList().map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Číslo smlouvy *</Label>
              <Input
                value={contractNumber}
                onChange={e => setContractNumber(e.target.value)}
                placeholder="Např. 123456789"
              />
            </div>
          </div>

          {/* Název a stav */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vlastní název</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={INSURANCE_CATEGORY_LABELS[category]}
              />
            </div>
            <div className="space-y-2">
              <Label>Stav</Label>
              <Select value={status} onValueChange={(value: InsuranceStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INSURANCE_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Předmět pojištění */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Předmět pojištění</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Co/koho pojištění kryje</Label>
                <Input
                  value={insuredSubject}
                  onChange={e => setInsuredSubject(e.target.value)}
                  placeholder="Např. provozovna, vozidlo, osoba..."
                />
              </div>
              {['life_insurance', 'pension_savings', 'long_term_care', 'dip', 'accident'].includes(category) && (
                <div className="space-y-2">
                  <Label>Pojištěná osoba</Label>
                  <Input
                    value={insuredPerson}
                    onChange={e => setInsuredPerson(e.target.value)}
                    placeholder="Jméno pojištěné osoby"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Finanční údaje */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Finanční údaje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pojistné / Příspěvek (Kč) *</Label>
                <Input
                  type="number"
                  value={premiumAmount}
                  onChange={e => setPremiumAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Frekvence platby *</Label>
                <Select value={paymentFrequency} onValueChange={(value: PaymentFrequency) => setPaymentFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calculatedAnnualPremium > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Roční pojistné: <span className="font-medium">{calculatedAnnualPremium.toLocaleString('cs-CZ')} Kč</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Limit plnění (Kč)</Label>
                <Input
                  type="number"
                  value={coverageLimit}
                  onChange={e => setCoverageLimit(e.target.value)}
                  placeholder="Neomezeno"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Spoluúčast (Kč)</Label>
                <Input
                  type="number"
                  value={deductible}
                  onChange={e => setDeductible(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Daňový odpočet */}
          {isTaxDeductibleCategory(category) && (
            <div className="space-y-4 bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-sm text-green-800 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Daňový odpočet
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="taxDeductible"
                  checked={isTaxDeductible}
                  onCheckedChange={(checked) => setIsTaxDeductible(checked as boolean)}
                />
                <Label htmlFor="taxDeductible" className="text-sm cursor-pointer">
                  Uplatnit daňový odpočet
                </Label>
              </div>
              {isTaxDeductible && (
                <div className="space-y-2">
                  <Label>Částka k odpočtu (Kč/rok)</Label>
                  <Input
                    type="number"
                    value={taxDeductibleAmount}
                    onChange={e => setTaxDeductibleAmount(e.target.value)}
                    placeholder={calculatedAnnualPremium > 0 ? `Max. ${Math.min(calculatedAnnualPremium, 48000)}` : 'Max. 48 000'}
                    min="0"
                    max="48000"
                  />
                  <p className="text-xs text-green-700">
                    Maximální odpočet: 48 000 Kč/rok (součet životního pojištění, penzijka, DIP a dlouhodobé péče)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Termíny */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Důležité termíny</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Datum uzavření smlouvy</Label>
                <Input
                  type="date"
                  value={contractDate}
                  onChange={e => setContractDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Datum účinnosti *</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Výroční datum *</Label>
                <Input
                  type="date"
                  value={anniversaryDate}
                  onChange={e => setAnniversaryDate(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Datum, kdy se smlouva obnovuje nebo je potřeba kontrola
                </p>
              </div>
              <div className="space-y-2">
                <Label>Datum ukončení</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Datum další platby</Label>
              <Input
                type="date"
                value={nextPaymentDate}
                onChange={e => setNextPaymentDate(e.target.value)}
              />
            </div>
          </div>

          {/* Propojení s majetkem/zaměstnancem */}
          {(assets.length > 0 || employees.length > 0) && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">Propojení</h3>
              <div className="grid grid-cols-2 gap-4">
                {assets.length > 0 && (
                  <div className="space-y-2">
                    <Label>Propojit s majetkem</Label>
                    <Select value={linkedAssetId} onValueChange={setLinkedAssetId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nevybráno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nevybráno</SelectItem>
                        {assets.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {employees.length > 0 && (
                  <div className="space-y-2">
                    <Label>Propojit se zaměstnancem</Label>
                    <Select value={linkedEmployeeId} onValueChange={setLinkedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nevybráno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nevybráno</SelectItem>
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.first_name} {e.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Poznámky */}
          <div className="space-y-2">
            <Label>Poznámky</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Doplňující informace k pojištění..."
              rows={3}
            />
          </div>
        </div>

        {/* Akce */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Ukládám...' : (isNew ? 'Přidat' : 'Uložit změny')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
