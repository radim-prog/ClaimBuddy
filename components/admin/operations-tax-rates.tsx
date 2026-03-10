'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_TAX_RATES, type TaxRates } from '@/lib/tax-calculator'

const currentYear = new Date().getFullYear()

const RATE_LABELS: Record<keyof TaxRates, string> = {
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
  social_minimum_advance: 'Min. záloha sociální (Kč)',
  health_minimum_advance: 'Min. záloha zdravotní (Kč)',
  social_max_assessment_base: 'Max. vyměřovací základ soc. (Kč)',
}

const RATE_TYPES: Record<keyof TaxRates, 'rate' | 'amount' | 'number'> = {
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
  social_minimum_advance: 'amount',
  health_minimum_advance: 'amount',
  social_max_assessment_base: 'amount',
}

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

  const formatValue = (key: keyof TaxRates, value: number): string => {
    if (RATE_TYPES[key] === 'rate') return String(value)
    return String(value)
  }

  const parseValue = (key: keyof TaxRates, input: string): number => {
    return parseFloat(input) || 0
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(Object.keys(RATE_LABELS) as Array<keyof TaxRates>).map((key) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              {RATE_LABELS[key]}
              {RATE_TYPES[key] === 'rate' && <span className="text-gray-400 ml-1">(0-1)</span>}
            </label>
            <Input
              type="number"
              step={RATE_TYPES[key] === 'rate' ? '0.001' : '1'}
              value={formatValue(key, rates[key])}
              onChange={(e) => setRates(prev => ({ ...prev, [key]: parseValue(key, e.target.value) }))}
              className="h-8 text-sm"
            />
          </div>
        ))}
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
