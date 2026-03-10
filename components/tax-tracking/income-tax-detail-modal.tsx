'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Save, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { calculateIncomeTax, DEFAULT_TAX_RATES, type TaxRates, type TaxAnnualConfig, type IncomeTaxCalculation } from '@/lib/tax-calculator'

type IncomeTaxDetailModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string
  year: number
}

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

export function IncomeTaxDetailModal({ open, onOpenChange, companyId, companyName, year }: IncomeTaxDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [yearTotals, setYearTotals] = useState({ revenue: 0, expenses: 0 })
  const [rates, setRates] = useState<TaxRates>(DEFAULT_TAX_RATES)

  // Config fields
  const [mortgageInterest, setMortgageInterest] = useState(0)
  const [savingsContributions, setSavingsContributions] = useState(0)
  const [otherDeductions, setOtherDeductions] = useState(0)
  const [taxpayerDiscount, setTaxpayerDiscount] = useState(true)
  const [childrenCount, setChildrenCount] = useState(0)
  const [otherCredits, setOtherCredits] = useState(0)
  const [socialAdvancesPaid, setSocialAdvancesPaid] = useState(0)
  const [healthAdvancesPaid, setHealthAdvancesPaid] = useState(0)
  const [initialTaxBase, setInitialTaxBase] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const fetchData = useCallback(async () => {
    if (!companyId || !open) return
    setLoading(true)
    try {
      const res = await fetch(`/api/accountant/tax-annual?company_id=${companyId}&year=${year}`)
      if (!res.ok) throw new Error('Fetch failed')
      const json = await res.json()

      setYearTotals(json.yearTotals || { revenue: 0, expenses: 0 })

      if (json.rates) {
        setRates({ ...DEFAULT_TAX_RATES, ...json.rates })
      }

      const cfg = json.config
      if (cfg) {
        setMortgageInterest(cfg.mortgage_interest || 0)
        setSavingsContributions(cfg.savings_contributions || 0)
        setOtherDeductions(cfg.other_deductions || 0)
        setTaxpayerDiscount(cfg.taxpayer_discount ?? true)
        setChildrenCount(cfg.children_count || 0)
        setOtherCredits(cfg.other_credits || 0)
        setSocialAdvancesPaid(cfg.social_advances_paid || 0)
        setHealthAdvancesPaid(cfg.health_advances_paid || 0)
        setInitialTaxBase(cfg.initial_tax_base !== null ? String(cfg.initial_tax_base) : '')
        setNotes(cfg.notes || '')
      } else {
        setMortgageInterest(0)
        setSavingsContributions(0)
        setOtherDeductions(0)
        setTaxpayerDiscount(true)
        setChildrenCount(0)
        setOtherCredits(0)
        setSocialAdvancesPaid(0)
        setHealthAdvancesPaid(0)
        setInitialTaxBase('')
        setNotes('')
      }
    } catch {
      toast.error('Nepodařilo se načíst data')
    } finally {
      setLoading(false)
    }
  }, [companyId, year, open])

  useEffect(() => { fetchData() }, [fetchData])

  const config: TaxAnnualConfig = useMemo(() => ({
    mortgage_interest: mortgageInterest,
    savings_contributions: savingsContributions,
    other_deductions: otherDeductions,
    taxpayer_discount: taxpayerDiscount,
    children_count: childrenCount,
    children_details: [],
    other_credits: otherCredits,
    social_advances_paid: socialAdvancesPaid,
    health_advances_paid: healthAdvancesPaid,
    initial_tax_base: initialTaxBase !== '' ? parseFloat(initialTaxBase) || null : null,
  }), [mortgageInterest, savingsContributions, otherDeductions, taxpayerDiscount, childrenCount, otherCredits, socialAdvancesPaid, healthAdvancesPaid, initialTaxBase])

  const calc: IncomeTaxCalculation = useMemo(() =>
    calculateIncomeTax(yearTotals, config, rates),
    [yearTotals, config, rates]
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/tax-annual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          year,
          mortgage_interest: mortgageInterest,
          savings_contributions: savingsContributions,
          other_deductions: otherDeductions,
          taxpayer_discount: taxpayerDiscount,
          children_count: childrenCount,
          children_details: [],
          other_credits: otherCredits,
          social_advances_paid: socialAdvancesPaid,
          health_advances_paid: healthAdvancesPaid,
          initial_tax_base: initialTaxBase !== '' ? parseFloat(initialTaxBase) || null : null,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(`DPFO ${companyName} ${year} uloženo`)
      onOpenChange(false)
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple-600" />
            DPFO kalkulátor — {companyName}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Rok {year}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Section 1: Revenue & Expenses (read-only from monthly data) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Příjmy & výdaje (z měsíčních dat)</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Příjmy</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">{CZK(yearTotals.revenue)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Výdaje</div>
                  <div className="font-semibold text-red-600 dark:text-red-400">{CZK(yearTotals.expenses)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Základ</div>
                  <div className={`font-bold ${calc.rawTaxBase >= 0 ? 'text-green-600' : 'text-red-600'}`}>{CZK(calc.rawTaxBase)}</div>
                </div>
              </div>
            </div>

            {/* Section 2: Deductions */}
            <div className="border-t dark:border-gray-700 pt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Odpočty od základu daně</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Úroky z hypotéky</label>
                  <Input type="number" value={mortgageInterest || ''} onChange={(e) => setMortgageInterest(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Penzijní spoření</label>
                  <Input type="number" value={savingsContributions || ''} onChange={(e) => setSavingsContributions(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Ostatní odpočty</label>
                  <Input type="number" value={otherDeductions || ''} onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* Section 3: Tax credits */}
            <div className="border-t dark:border-gray-700 pt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Slevy na dani</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={taxpayerDiscount} onChange={(e) => setTaxpayerDiscount(e.target.checked)} className="rounded" />
                  <span className="text-sm">Sleva na poplatníka ({CZK(rates.taxpayer_discount)})</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Počet dětí</label>
                    <Input type="number" min="0" step="1" value={childrenCount || ''} onChange={(e) => setChildrenCount(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Ostatní slevy (Kč)</label>
                    <Input type="number" value={otherCredits || ''} onChange={(e) => setOtherCredits(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Insurance */}
            <div className="border-t dark:border-gray-700 pt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Zálohy na pojistné</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Sociální zálohy zaplacené</label>
                  <Input type="number" value={socialAdvancesPaid || ''} onChange={(e) => setSocialAdvancesPaid(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Zdravotní zálohy zaplacené</label>
                  <Input type="number" value={healthAdvancesPaid || ''} onChange={(e) => setHealthAdvancesPaid(parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* RESULT */}
            <div className={`rounded-lg p-4 ${calc.totalDue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
              <div className="text-xs font-medium text-gray-500 mb-1">CELKEM K ZAPLACENÍ</div>
              <div className={`text-2xl font-bold ${calc.totalDue > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                {CZK(calc.totalDue)}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Daň:</span>
                  <span className="ml-1 font-medium">{CZK(Math.max(0, calc.netTax))}</span>
                </div>
                <div>
                  <span className="text-gray-500">Soc.:</span>
                  <span className="ml-1 font-medium">{CZK(Math.max(0, calc.socialDue))}</span>
                </div>
                <div>
                  <span className="text-gray-500">Zdrav.:</span>
                  <span className="ml-1 font-medium">{CZK(Math.max(0, calc.healthDue))}</span>
                </div>
              </div>
            </div>

            {/* Detail toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showDetails ? 'Skrýt detail výpočtu' : 'Zobrazit detail výpočtu'}
            </button>

            {showDetails && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between"><span>Základ daně:</span><span>{CZK(calc.rawTaxBase)}</span></div>
                <div className="flex justify-between"><span>Odpočty:</span><span>−{CZK(calc.totalDeductions)}</span></div>
                <div className="flex justify-between"><span>Upravený základ (zaokr.):</span><span>{CZK(calc.roundedBase)}</span></div>
                <div className="flex justify-between border-t pt-1"><span>Daň 15%:</span><span>{CZK(calc.taxRate1Amount)}</span></div>
                {calc.taxRate2Amount > 0 && (
                  <div className="flex justify-between"><span>Daň 23% (nad práh):</span><span>{CZK(calc.taxRate2Amount)}</span></div>
                )}
                <div className="flex justify-between font-medium"><span>Hrubá daň:</span><span>{CZK(calc.grossTax)}</span></div>
                <div className="flex justify-between"><span>Sleva poplatník:</span><span>−{CZK(calc.taxpayerCredit)}</span></div>
                {calc.childrenCredit > 0 && (
                  <div className="flex justify-between"><span>Sleva děti:</span><span>−{CZK(calc.childrenCredit)}</span></div>
                )}
                <div className="flex justify-between font-medium border-t pt-1"><span>Daň po slevách:</span><span>{CZK(calc.netTax)}</span></div>
                <div className="flex justify-between border-t pt-1"><span>Sociální pojistné:</span><span>{CZK(calc.socialCalculated)}</span></div>
                <div className="flex justify-between"><span>Zaplacené zálohy:</span><span>−{CZK(calc.socialAdvancesPaid)}</span></div>
                <div className="flex justify-between font-medium"><span>Doplatek soc.:</span><span>{CZK(calc.socialDue)}</span></div>
                <div className="flex justify-between border-t pt-1"><span>Zdravotní pojistné:</span><span>{CZK(calc.healthCalculated)}</span></div>
                <div className="flex justify-between"><span>Zaplacené zálohy:</span><span>−{CZK(calc.healthAdvancesPaid)}</span></div>
                <div className="flex justify-between font-medium"><span>Doplatek zdrav.:</span><span>{CZK(calc.healthDue)}</span></div>
              </div>
            )}

            {/* Savings section */}
            <div className="border-t dark:border-gray-700 pt-3">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Úspory klienta</div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-0.5">Počáteční základ daně (před optimalizací)</label>
                <Input type="number" value={initialTaxBase} onChange={(e) => setInitialTaxBase(e.target.value)} placeholder="Prázdné = bez porovnání" className="h-8 text-sm" />
              </div>
              {calc.taxSavings !== null && (
                <div className="mt-2 bg-green-50 dark:bg-green-900/20 rounded p-2 text-sm">
                  Ušetřeno: <span className="font-bold text-green-700 dark:text-green-400">{CZK(calc.taxSavings)}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="border-t dark:border-gray-700 pt-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">Poznámka</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Poznámky k roční kalkulaci..." rows={2} className="resize-none" />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">Zavřít</Button>
          <Button onClick={handleSave} disabled={saving || loading} size="sm">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
