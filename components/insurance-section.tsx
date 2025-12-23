'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
  Trash2,
  Calendar,
  Banknote,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import {
  Insurance,
  InsuranceCategory,
  InsuranceStatus,
  INSURANCE_CATEGORY_LABELS,
  INSURANCE_CATEGORY_GROUPS,
  INSURANCE_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
  isTaxDeductibleCategory,
} from '@/lib/types/insurance'
import { Asset } from '@/lib/types/asset'
import { Employee } from '@/lib/types/employee'
import { EditInsuranceModal } from './edit-insurance-modal'

type InsuranceSectionProps = {
  companyId: string
  insurances: Insurance[]
  assets?: Asset[]
  employees?: Employee[]
  onInsurancesChange?: (insurances: Insurance[]) => void
  defaultOpen?: boolean
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

const STATUS_ICONS: Record<InsuranceStatus, React.ReactNode> = {
  active: <CheckCircle className="h-4 w-4 text-green-600" />,
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  expired: <AlertTriangle className="h-4 w-4 text-red-600" />,
  cancelled: <XCircle className="h-4 w-4 text-gray-600" />,
}

const STATUS_COLORS: Record<InsuranceStatus, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

export function InsuranceSection({
  companyId,
  insurances,
  assets = [],
  employees = [],
  onInsurancesChange,
  defaultOpen = true,
}: InsuranceSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [expandedInsurance, setExpandedInsurance] = useState<string | null>(null)
  const [editingInsurance, setEditingInsurance] = useState<Insurance | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  const toggleExpand = (id: string) => {
    setExpandedInsurance(expandedInsurance === id ? null : id)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ')
  }

  const handleSaveInsurance = (insurance: Insurance) => {
    if (onInsurancesChange) {
      const existingIndex = insurances.findIndex((i) => i.id === insurance.id)
      if (existingIndex >= 0) {
        const updated = [...insurances]
        updated[existingIndex] = insurance
        onInsurancesChange(updated)
      } else {
        onInsurancesChange([...insurances, insurance])
      }
    }
    setEditingInsurance(null)
    setIsAddingNew(false)
  }

  const handleDeleteInsurance = (insuranceId: string) => {
    if (onInsurancesChange && confirm('Opravdu chcete smazat toto pojištění?')) {
      onInsurancesChange(insurances.filter((i) => i.id !== insuranceId))
    }
  }

  // Rozdělit pojištění podle skupin
  const activeInsurances = insurances.filter((i) => i.status === 'active')
  const inactiveInsurances = insurances.filter((i) => i.status !== 'active')

  // Spočítat daňově odečitatelné
  const taxDeductibleInsurances = activeInsurances.filter((i) => i.is_tax_deductible)
  const totalTaxDeductible = taxDeductibleInsurances.reduce(
    (sum, i) => sum + (i.tax_deductible_amount || 0),
    0
  )
  const totalAnnualPremium = activeInsurances.reduce((sum, i) => sum + i.annual_premium, 0)

  // Zjistit blížící se výročí (do 30 dnů)
  const today = new Date()
  const upcomingAnniversaries = activeInsurances.filter((i) => {
    const anniversary = new Date(i.anniversary_date)
    const daysUntil = Math.ceil((anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 30
  })

  const getCategoryGroup = (category: InsuranceCategory): string => {
    for (const [key, group] of Object.entries(INSURANCE_CATEGORY_GROUPS)) {
      if (group.categories.includes(category)) {
        return key
      }
    }
    return 'other'
  }

  const getCategoryGroupColor = (category: InsuranceCategory): string => {
    const group = getCategoryGroup(category)
    switch (group) {
      case 'tax_deductible':
        return 'bg-green-100 text-green-700'
      case 'business':
        return 'bg-blue-100 text-blue-700'
      case 'personal':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const renderInsuranceCard = (insurance: Insurance) => {
    const isExpanded = expandedInsurance === insurance.id
    const linkedAsset = assets.find((a) => a.id === insurance.linked_asset_id)
    const linkedEmployee = employees.find((e) => e.id === insurance.linked_employee_id)

    // Zjistit, zda je výročí blízko
    const anniversary = new Date(insurance.anniversary_date)
    const daysUntilAnniversary = Math.ceil(
      (anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    const isAnniversarySoon = daysUntilAnniversary >= 0 && daysUntilAnniversary <= 30

    return (
      <div
        key={insurance.id}
        className={`border rounded-lg overflow-hidden ${isAnniversarySoon ? 'border-orange-300 bg-orange-50' : ''}`}
      >
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
          onClick={() => toggleExpand(insurance.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getCategoryGroupColor(insurance.category)}`}>
              {CATEGORY_ICONS[insurance.category]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{insurance.name}</span>
                <Badge variant="outline" className={STATUS_COLORS[insurance.status]}>
                  {STATUS_ICONS[insurance.status]}
                  <span className="ml-1">{INSURANCE_STATUS_LABELS[insurance.status]}</span>
                </Badge>
                {insurance.is_tax_deductible && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Daňově odečitatelné
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-4">
                <span>{insurance.provider}</span>
                <span>•</span>
                <span>Smlouva: {insurance.contract_number}</span>
                {isAnniversarySoon && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Výročí za {daysUntilAnniversary} {daysUntilAnniversary === 1 ? 'den' : daysUntilAnniversary < 5 ? 'dny' : 'dní'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">{formatCurrency(insurance.annual_premium)}/rok</div>
              <div className="text-sm text-gray-500">
                {formatCurrency(insurance.premium_amount)} {PAYMENT_FREQUENCY_LABELS[insurance.payment_frequency].toLowerCase()}
              </div>
            </div>
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>

        {isExpanded && (
          <div className="p-4 border-t bg-gray-50 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Kategorie</div>
                <div className="font-medium">{INSURANCE_CATEGORY_LABELS[insurance.category]}</div>
              </div>
              <div>
                <div className="text-gray-500">Předmět pojištění</div>
                <div className="font-medium">{insurance.insured_subject || '-'}</div>
              </div>
              {insurance.insured_person && (
                <div>
                  <div className="text-gray-500">Pojištěná osoba</div>
                  <div className="font-medium">{insurance.insured_person}</div>
                </div>
              )}
              {insurance.coverage_limit && (
                <div>
                  <div className="text-gray-500">Limit plnění</div>
                  <div className="font-medium">{formatCurrency(insurance.coverage_limit)}</div>
                </div>
              )}
              {insurance.deductible && (
                <div>
                  <div className="text-gray-500">Spoluúčast</div>
                  <div className="font-medium">{formatCurrency(insurance.deductible)}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Datum účinnosti</div>
                <div className="font-medium">{formatDate(insurance.effective_date)}</div>
              </div>
              <div>
                <div className="text-gray-500">Výroční datum</div>
                <div className={`font-medium ${isAnniversarySoon ? 'text-orange-600' : ''}`}>
                  {formatDate(insurance.anniversary_date)}
                </div>
              </div>
              {insurance.expiry_date && (
                <div>
                  <div className="text-gray-500">Datum ukončení</div>
                  <div className="font-medium">{formatDate(insurance.expiry_date)}</div>
                </div>
              )}
              {insurance.is_tax_deductible && insurance.tax_deductible_amount && (
                <div>
                  <div className="text-gray-500">Daňový odpočet</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(insurance.tax_deductible_amount)}/rok
                  </div>
                </div>
              )}
              {linkedAsset && (
                <div>
                  <div className="text-gray-500">Propojený majetek</div>
                  <div className="font-medium">{linkedAsset.name}</div>
                </div>
              )}
              {linkedEmployee && (
                <div>
                  <div className="text-gray-500">Propojený zaměstnanec</div>
                  <div className="font-medium">
                    {linkedEmployee.first_name} {linkedEmployee.last_name}
                  </div>
                </div>
              )}
            </div>

            {insurance.notes && (
              <div>
                <div className="text-gray-500 text-sm">Poznámky</div>
                <div className="text-sm">{insurance.notes}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingInsurance(insurance)
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Upravit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteInsurance(insurance.id)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Smazat
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Card className="scroll-mt-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 hover:text-purple-600 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
              <Shield className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Pojištění a smlouvy</CardTitle>
              {insurances.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({activeInsurances.length} aktivních • {formatCurrency(totalAnnualPremium)})
                </span>
              )}
            </button>
            {isOpen && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Přidat pojištění
              </Button>
            )}
          </div>
          {isOpen && totalTaxDeductible > 0 && (
            <div className="text-sm text-green-600 mt-2 ml-12">
              Daňový odpočet: {formatCurrency(totalTaxDeductible)}
            </div>
          )}
        </CardHeader>
        {isOpen && (
          <CardContent>
            {/* Upozornění na blížící se výročí */}
          {upcomingAnniversaries.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Blížící se výročí ({upcomingAnniversaries.length})
              </div>
              <div className="text-sm text-orange-600 mt-1">
                {upcomingAnniversaries.map((i) => i.name).join(', ')}
              </div>
            </div>
          )}

          {/* Souhrn daňových odpočtů */}
          {taxDeductibleInsurances.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <Wallet className="h-4 w-4" />
                  Daňově odečitatelné produkty ({taxDeductibleInsurances.length})
                </div>
                <div className="text-green-700 font-semibold">
                  {formatCurrency(totalTaxDeductible)} / 48 000 Kč max.
                </div>
              </div>
              <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full"
                  style={{ width: `${Math.min((totalTaxDeductible / 48000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {insurances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Žádná pojištění</p>
              <p className="text-sm">Klikněte na "Přidat pojištění" pro přidání nového záznamu</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aktivní pojištění */}
              {activeInsurances.length > 0 && (
                <div className="space-y-2">
                  {activeInsurances.map(renderInsuranceCard)}
                </div>
              )}

              {/* Neaktivní pojištění */}
              {inactiveInsurances.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 text-gray-500"
                    onClick={() => setShowInactive(!showInactive)}
                  >
                    {showInactive ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    Neaktivní pojištění ({inactiveInsurances.length})
                  </Button>
                  {showInactive && (
                    <div className="space-y-2 opacity-70">
                      {inactiveInsurances.map(renderInsuranceCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </CardContent>
        )}
      </Card>

      {/* Modal pro přidání/editaci */}
      <EditInsuranceModal
        open={isAddingNew || !!editingInsurance}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingNew(false)
            setEditingInsurance(null)
          }
        }}
        insurance={editingInsurance}
        companyId={companyId}
        assets={assets}
        employees={employees}
        onSave={handleSaveInsurance}
      />
    </>
  )
}
