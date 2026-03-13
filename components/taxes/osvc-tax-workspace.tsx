'use client'

import { useState, useMemo } from 'react'
import { Save, Loader2, Plus, X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { calculateIncomeTax, calculateFlatTax, DEFAULT_TAX_RATES, type TaxRates, type TaxAnnualConfig, type IncomeTaxCalculation } from '@/lib/tax-calculator'
import type { TaxAnnualConfigRow } from '@/lib/types/tax'
import { TaxResultSummary } from './tax-result-summary'

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

type Props = {
  companyId: string
  year: number
  config: Partial<TaxAnnualConfigRow>
  yearTotals: { revenue: number; expenses: number }
  rates: TaxRates | null
  onConfigUpdate: (c: Partial<TaxAnnualConfigRow>) => void
}

export function OsvcTaxWorkspace({ companyId, year, config, yearTotals, rates: ratesProp, onConfigUpdate }: Props) {
  const [saving, setSaving] = useState(false)
  const [localConfig, setLocalConfig] = useState<Partial<TaxAnnualConfigRow>>(config)
  const rates = ratesProp || DEFAULT_TAX_RATES

  // Use annual_revenue/expenses from config if set, otherwise from yearTotals
  const revenue = localConfig.annual_revenue ?? yearTotals.revenue
  const expenses = localConfig.annual_expenses ?? yearTotals.expenses

  const taxConfig: TaxAnnualConfig = {
    mortgage_interest: localConfig.mortgage_interest || 0,
    dip_contributions: localConfig.dip_contributions || 0,
    savings_contributions: localConfig.savings_contributions || 0,
    other_deductions: localConfig.other_deductions || 0,
    taxpayer_discount: localConfig.taxpayer_discount ?? true,
    children_count: localConfig.children_count || 0,
    children_details: localConfig.children_details || [],
    other_credits: localConfig.other_credits || 0,
    social_advances_paid: localConfig.social_advances_paid || 0,
    health_advances_paid: localConfig.health_advances_paid || 0,
    initial_tax_base: localConfig.initial_tax_base ?? null,
    is_flat_tax: localConfig.is_flat_tax ?? false,
    flat_tax_band: localConfig.flat_tax_band ?? null,
    is_secondary_activity: localConfig.is_secondary_activity ?? false,
  }

  const calc = useMemo(() => {
    return calculateIncomeTax({ revenue, expenses }, taxConfig, rates)
  }, [revenue, expenses, taxConfig, rates])

  const flatTaxCalc = taxConfig.is_flat_tax && taxConfig.flat_tax_band
    ? calculateFlatTax(taxConfig.flat_tax_band, rates)
    : null
  const revenueExceedsBand = flatTaxCalc && revenue > flatTaxCalc.revenueLimit

  function updateField(field: string, value: any) {
    setLocalConfig(prev => ({ ...prev, [field]: value }))
  }

  function addChild() {
    const details = [...(localConfig.children_details || [])]
    details.push({ order: details.length + 1, ztpp: false })
    setLocalConfig(prev => ({ ...prev, children_details: details, children_count: details.length }))
  }

  function removeChild(index: number) {
    const details = [...(localConfig.children_details || [])]
    details.splice(index, 1)
    // Re-order
    details.forEach((d, i) => { d.order = i + 1 })
    setLocalConfig(prev => ({ ...prev, children_details: details, children_count: details.length }))
  }

  function toggleChildZtpp(index: number) {
    const details = [...(localConfig.children_details || [])]
    details[index] = { ...details[index], ztpp: !details[index].ztpp }
    setLocalConfig(prev => ({ ...prev, children_details: details }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/tax-annual', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          year,
          ...localConfig,
          annual_revenue: revenue,
          annual_expenses: expenses,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      onConfigUpdate(data)
      toast.success('Uloženo')
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const isFlatTax = taxConfig.is_flat_tax

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={localConfig.use_profile_data ?? false}
            onChange={e => updateField('use_profile_data', e.target.checked)}
            className="rounded border-gray-300"
          />
          Použít v master matici
        </label>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-soft-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Uložit
        </button>
      </div>

      {/* PŘÍJMY A VÝDAJE */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Příjmy a výdaje</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Příjmy</label>
            <input
              type="number"
              value={(localConfig.annual_revenue ?? yearTotals.revenue) || ''}
              onChange={e => updateField('annual_revenue', parseFloat(e.target.value) || 0)}
              className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Výdaje</label>
            <input
              type="number"
              value={(localConfig.annual_expenses ?? yearTotals.expenses) || ''}
              onChange={e => updateField('annual_expenses', parseFloat(e.target.value) || 0)}
              className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Základ daně</label>
            <div className="h-9 flex items-center text-sm font-semibold text-gray-900 dark:text-white">{CZK(revenue - expenses)}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFlatTax}
              onChange={e => updateField('is_flat_tax', e.target.checked)}
              className="rounded border-gray-300"
            />
            Paušální daň
          </label>
          {isFlatTax && (
            <select
              value={localConfig.flat_tax_band ?? 1}
              onChange={e => updateField('flat_tax_band', parseInt(e.target.value))}
              className="h-8 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <option value={1}>Pásmo 1</option>
              <option value={2}>Pásmo 2</option>
              <option value={3}>Pásmo 3</option>
            </select>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={localConfig.is_secondary_activity ?? false}
              onChange={e => updateField('is_secondary_activity', e.target.checked)}
              className="rounded border-gray-300"
            />
            Vedlejší činnost
          </label>
        </div>
        {revenueExceedsBand && flatTaxCalc && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Příjmy ({CZK(revenue)}) překračují limit pásma ({CZK(flatTaxCalc.revenueLimit)})!
          </div>
        )}
      </div>

      {!isFlatTax && (
        <>
          {/* ODPOČTY OD ZÁKLADU */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Odpočty od základu</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hypotéka</label>
                <input type="number" value={localConfig.mortgage_interest || ''} onChange={e => updateField('mortgage_interest', parseFloat(e.target.value) || 0)}
                  className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">DIP</label>
                <input type="number" value={localConfig.dip_contributions || ''} onChange={e => updateField('dip_contributions', parseFloat(e.target.value) || 0)}
                  className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Spoření</label>
                <input type="number" value={localConfig.savings_contributions || ''} onChange={e => updateField('savings_contributions', parseFloat(e.target.value) || 0)}
                  className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right" placeholder="0" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ostatní</label>
                <input type="number" value={localConfig.other_deductions || ''} onChange={e => updateField('other_deductions', parseFloat(e.target.value) || 0)}
                  className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right" placeholder="0" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Celkem odpočtů: <strong>{CZK(calc.totalDeductions)}</strong></span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span>Upravený základ: <strong>{CZK(calc.adjustedBase)}</strong></span>
            </div>
          </div>

          {/* SLEVY NA DANI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Slevy na dani</div>
            <div className="flex flex-wrap gap-4 items-start">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={localConfig.taxpayer_discount ?? true} onChange={e => updateField('taxpayer_discount', e.target.checked)} className="rounded border-gray-300" />
                Poplatník ({CZK(rates.taxpayer_discount)})
              </label>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Ostatní slevy</label>
                <input type="number" value={localConfig.other_credits || ''} onChange={e => updateField('other_credits', parseFloat(e.target.value) || 0)}
                  className="h-8 w-28 px-2 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-right" placeholder="0" />
              </div>
            </div>
            {/* Children */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Děti:</span>
                <button onClick={addChild} className="h-7 px-2 text-xs text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg flex items-center gap-1 transition-colors">
                  <Plus className="h-3 w-3" /> Přidat dítě
                </button>
              </div>
              {(localConfig.children_details || []).map((child, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 w-16">{child.order}. dítě</span>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={child.ztpp} onChange={() => toggleChildZtpp(i)} className="rounded border-gray-300" />
                    <span className="text-xs">ZTP/P</span>
                  </label>
                  <span className="text-gray-400 text-xs">
                    ({CZK(child.order === 1 ? rates.child_discount_1 : child.order === 2 ? rates.child_discount_2 : rates.child_discount_3_plus)}{child.ztpp ? ' ×2' : ''})
                  </span>
                  <button onClick={() => removeChild(i)} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* VÝPOČET DANĚ */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Výpočet daně</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">15%</div>
                <div className="font-medium">{CZK(calc.taxRate1Amount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">23%</div>
                <div className="font-medium">{CZK(calc.taxRate2Amount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Hrubá daň</div>
                <div className="font-semibold">{CZK(calc.grossTax)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Daň po slevách</div>
                <div className={`font-bold ${calc.netTax > 0 ? 'text-red-600 dark:text-red-400' : calc.netTax < 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                  {CZK(calc.netTax)}
                  {calc.netTax < 0 && <span className="text-xs ml-1">(bonus)</span>}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Slevy: -{CZK(calc.totalCredits)} (poplatník: {CZK(calc.taxpayerCredit)}, děti: {CZK(calc.childrenCredit)}{calc.otherCredits > 0 ? `, ostatní: ${CZK(calc.otherCredits)}` : ''})
            </div>
          </div>

          {/* SOCIÁLNÍ POJIŠTĚNÍ */}
          <InsuranceCard
            label="Sociální pojištění"
            base={calc.socialBase}
            calculated={calc.socialCalculated}
            rateLabel={`${(rates.social_base_percentage * 100).toFixed(0)}% × ${(rates.social_insurance_rate * 100).toFixed(1)}%`}
            advancesPaid={localConfig.social_advances_paid || 0}
            onAdvancesChange={v => updateField('social_advances_paid', v)}
            due={calc.socialDue}
            minimumApplied={calc.socialMinimumApplied}
          />

          {/* ZDRAVOTNÍ POJIŠTĚNÍ */}
          <InsuranceCard
            label="Zdravotní pojištění"
            base={calc.healthBase}
            calculated={calc.healthCalculated}
            rateLabel={`${(rates.health_base_percentage * 100).toFixed(0)}% × ${(rates.health_insurance_rate * 100).toFixed(1)}%`}
            advancesPaid={localConfig.health_advances_paid || 0}
            onAdvancesChange={v => updateField('health_advances_paid', v)}
            due={calc.healthDue}
            minimumApplied={calc.healthMinimumApplied}
          />
        </>
      )}

      {isFlatTax && flatTaxCalc && (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 space-y-3">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Paušální daň — pásmo {localConfig.flat_tax_band}</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">Daň</div>
              <div className="font-medium">{CZK(flatTaxCalc.annualTax)}/rok</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Sociální</div>
              <div className="font-medium">{CZK(flatTaxCalc.annualSocial)}/rok</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Zdravotní</div>
              <div className="font-medium">{CZK(flatTaxCalc.annualHealth)}/rok</div>
            </div>
          </div>
          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
            Celkem: {CZK(flatTaxCalc.annualTotal)}/rok ({CZK(flatTaxCalc.monthlyTotal)}/měs)
          </div>
        </div>
      )}

      {/* CELKOVÝ SOUHRN */}
      <TaxResultSummary
        items={[
          { label: 'Daň', value: isFlatTax ? (calc.netTax) : Math.max(0, calc.netTax) },
          ...(!isFlatTax ? [
            { label: 'SP', value: calc.socialDue },
            { label: 'ZP', value: calc.healthDue },
          ] : [
            { label: 'SP', value: calc.socialDue },
            { label: 'ZP', value: calc.healthDue },
          ]),
        ]}
        total={calc.totalDue}
      />

      {/* Poznámka */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <label className="text-xs text-gray-500 block mb-1">Poznámka</label>
        <textarea
          rows={3}
          value={localConfig.notes || ''}
          onChange={e => updateField('notes', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="Poznámka k roční kalkulaci..."
        />
      </div>
    </div>
  )
}

function InsuranceCard({
  label, base, calculated, rateLabel, advancesPaid, onAdvancesChange, due, minimumApplied,
}: {
  label: string; base: number; calculated: number; rateLabel: string
  advancesPaid: number; onAdvancesChange: (v: number) => void; due: number; minimumApplied?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end text-sm">
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Vym. základ</div>
          <div className="font-medium">{CZK(base)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Pojistné ({rateLabel})</div>
          <div className="font-medium">
            {CZK(calculated)}
            {minimumApplied && (
              <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">min.</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Zaplacené zálohy</div>
          <input
            type="number"
            value={advancesPaid || ''}
            onChange={e => onAdvancesChange(parseFloat(e.target.value) || 0)}
            className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            placeholder="0"
          />
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Doplatek/přeplatek</div>
          <div className={`font-bold ${due > 0 ? 'text-red-600 dark:text-red-400' : due < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
            {due > 0 ? '+' : ''}{CZK(due)}
          </div>
        </div>
      </div>
    </div>
  )
}
