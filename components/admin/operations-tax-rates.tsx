'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_TAX_RATES, type TaxRates } from '@/lib/tax-calculator'

const currentYear = new Date().getFullYear()

// Labels and types for core rates (excluding flat_tax_bands which is handled separately)
const RATE_LABELS: Record<string, string> = {
  income_tax_rate_1: 'Sazba daně 1. pásmo',
  income_tax_rate_2: 'Sazba daně 2. pásmo',
  income_tax_threshold: 'Práh 2. pásma (Kč)',
  taxpayer_discount: 'Sleva na poplatníka (Kč)',
  child_discount_1: 'Sleva 1. dítě (Kč)',
  child_discount_2: 'Sleva 2. dítě (Kč)',
  child_discount_3_plus: 'Sleva 3.+ dítě (Kč)',
  child_ztpp_multiplier: 'ZTP/P násobitel',
  social_insurance_rate: 'Sociální pojistné (sazba)',
  health_insurance_rate: 'Zdravotní pojistné (sazba)',
  social_base_percentage: 'Vyměř. základ SP (sazba)',
  health_base_percentage: 'Vyměř. základ ZP (sazba)',
  social_minimum_advance: 'Min. záloha SP hlavní (Kč)',
  health_minimum_advance: 'Min. záloha ZP hlavní (Kč)',
  social_minimum_advance_secondary: 'Min. záloha SP vedlejší (Kč)',
  health_minimum_advance_secondary: 'Min. záloha ZP vedlejší (Kč)',
  social_max_assessment_base: 'Max. vyměřovací základ soc. (Kč)',
}

const RATE_TYPES: Record<string, 'rate' | 'amount' | 'number'> = {
  income_tax_rate_1: 'rate',
  income_tax_rate_2: 'rate',
  income_tax_threshold: 'amount',
  taxpayer_discount: 'amount',
  child_discount_1: 'amount',
  child_discount_2: 'amount',
  child_discount_3_plus: 'amount',
  child_ztpp_multiplier: 'number',
  social_insurance_rate: 'rate',
  health_insurance_rate: 'rate',
  social_base_percentage: 'rate',
  health_base_percentage: 'rate',
  social_minimum_advance: 'amount',
  health_minimum_advance: 'amount',
  social_minimum_advance_secondary: 'amount',
  health_minimum_advance_secondary: 'amount',
  social_max_assessment_base: 'amount',
}

const CORE_RATE_KEYS = Object.keys(RATE_LABELS)

export function OperationsTaxRates() {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [rates, setRates] = useState<TaxRates>({ ...DEFAULT_TAX_RATES })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch(`/api/accountant/tax-rates?year=${selectedYear}`)
      if (!res.ok) return
      const json = await res.json()
      if (json.rates) {
        setRates({ ...DEFAULT_TAX_RATES, ...json.rates })
      } else {
        setRates({ ...DEFAULT_TAX_RATES })
      }
      setLoaded(true)
    } catch {
      toast.error('Nepodařilo se načíst sazby')
    }
  }, [selectedYear])

  useEffect(() => { fetchRates() }, [fetchRates])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/accountant/tax-rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: selectedYear, rates }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(`Sazby pro rok ${selectedYear} uloženy`)
    } catch {
      toast.error('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const copyFromPrevYear = async () => {
    try {
      const res = await fetch(`/api/accountant/tax-rates?year=${selectedYear - 1}`)
      if (!res.ok) return
      const json = await res.json()
      if (json.rates) {
        setRates({ ...DEFAULT_TAX_RATES, ...json.rates })
        toast.success(`Sazby zkopírovány z roku ${selectedYear - 1}`)
      } else {
        toast.info(`Rok ${selectedYear - 1} nemá uložené sazby`)
      }
    } catch {
      toast.error('Chyba při kopírování')
    }
  }

  const updateFlatTaxBand = (band: number, field: string, value: number) => {
    setRates(prev => ({
      ...prev,
      flat_tax_bands: {
        ...DEFAULT_TAX_RATES.flat_tax_bands,
        ...prev.flat_tax_bands,
        [band]: {
          ...(prev.flat_tax_bands?.[band] ?? DEFAULT_TAX_RATES.flat_tax_bands?.[band] ?? { revenue_limit: 0, monthly_tax: 0, monthly_social: 0, monthly_health: 0 }),
          [field]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm"
          >
            ←
          </button>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded text-sm min-w-[56px] text-center">
            {selectedYear}
          </span>
          <button
            onClick={() => setSelectedYear(y => y + 1)}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm"
          >
            →
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={copyFromPrevYear}>
          <Copy className="h-3.5 w-3.5 mr-1" />
          Kopírovat z {selectedYear - 1}
        </Button>

        <Button variant="outline" size="sm" onClick={() => setRates({ ...DEFAULT_TAX_RATES })}>
          Reset na default
        </Button>
      </div>

      {/* Core rates grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CORE_RATE_KEYS.map((key) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              {RATE_LABELS[key]}
              {RATE_TYPES[key] === 'rate' && <span className="text-gray-400 ml-1">(0-1)</span>}
            </label>
            <Input
              type="number"
              step={RATE_TYPES[key] === 'rate' ? '0.001' : '1'}
              value={String((rates as any)[key] ?? 0)}
              onChange={(e) => setRates(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Flat tax bands */}
      <div>
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Paušální daň — pásma</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-1.5 pr-3 text-xs font-medium text-gray-500">Pásmo</th>
                <th className="text-right py-1.5 px-2 text-xs font-medium text-gray-500">Limit příjmů (Kč)</th>
                <th className="text-right py-1.5 px-2 text-xs font-medium text-gray-500">Daň/měs (Kč)</th>
                <th className="text-right py-1.5 px-2 text-xs font-medium text-gray-500">Sociální/měs (Kč)</th>
                <th className="text-right py-1.5 px-2 text-xs font-medium text-gray-500">Zdravotní/měs (Kč)</th>
                <th className="text-right py-1.5 pl-2 text-xs font-medium text-gray-500">Celkem/měs</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map(band => {
                const b = rates.flat_tax_bands?.[band] ?? DEFAULT_TAX_RATES.flat_tax_bands?.[band]
                if (!b) return null
                const total = b.monthly_tax + b.monthly_social + b.monthly_health
                return (
                  <tr key={band} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-1.5 pr-3 font-medium">{band}.</td>
                    <td className="py-1.5 px-2">
                      <Input
                        type="number"
                        value={b.revenue_limit}
                        onChange={e => updateFlatTaxBand(band, 'revenue_limit', parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-right w-28 ml-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        type="number"
                        value={b.monthly_tax}
                        onChange={e => updateFlatTaxBand(band, 'monthly_tax', parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-right w-24 ml-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        type="number"
                        value={b.monthly_social}
                        onChange={e => updateFlatTaxBand(band, 'monthly_social', parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-right w-24 ml-auto"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input
                        type="number"
                        value={b.monthly_health}
                        onChange={e => updateFlatTaxBand(band, 'monthly_health', parseFloat(e.target.value) || 0)}
                        className="h-7 text-sm text-right w-24 ml-auto"
                      />
                    </td>
                    <td className="py-1.5 pl-2 text-right font-medium text-gray-600 dark:text-gray-300">
                      {Math.round(total).toLocaleString('cs-CZ')} Kč
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? 'Ukládám...' : 'Uložit sazby'}
        </Button>
      </div>
    </div>
  )
}
