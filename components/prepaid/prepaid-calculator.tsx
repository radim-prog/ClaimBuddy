'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calculator, Plus, X, Trash2 } from 'lucide-react'

type ItemType = 'work' | 'travel' | 'wasted_time' | 'other'

type BudgetItem = {
  id: string
  type: ItemType
  description: string
  // work: hours × rate
  hours?: number
  rate?: number
  // travel: km × rate_per_km × 2 (round trip) × trips
  km?: number
  rate_per_km?: number
  trips?: number
  // other: flat amount
  amount?: number
}

type PrepaidCalculatorProps = {
  companyId: string
  companyName: string
  defaultHourlyRate?: number
  onCreated?: () => void
  onCancel?: () => void
}

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  work: 'Práce',
  travel: 'Cestovné',
  wasted_time: 'Promeškaný čas',
  other: 'Ostatní',
}

let nextId = 1
function genId() { return `item-${nextId++}-${Date.now()}` }

function calcItemTotal(item: BudgetItem): number {
  switch (item.type) {
    case 'work':
    case 'wasted_time':
      return (item.hours || 0) * (item.rate || 0)
    case 'travel':
      return (item.km || 0) * (item.rate_per_km || 0) * 2 * (item.trips || 1)
    case 'other':
      return item.amount || 0
    default:
      return 0
  }
}

export function PrepaidCalculator({
  companyId,
  companyName,
  defaultHourlyRate = 700,
  onCreated,
  onCancel,
}: PrepaidCalculatorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [alreadyPaid, setAlreadyPaid] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default rates from settings
  const [rates, setRates] = useState({
    hourly: defaultHourlyRate,
    km: 4.5,
    wasted: 350,
  })

  // Fetch default rates
  useEffect(() => {
    fetch('/api/accountant/settings')
      .then(r => r.json())
      .then(data => {
        const s = data.settings || {}
        setRates({
          hourly: Number(s.default_hourly_rate) || defaultHourlyRate,
          km: Number(s.default_km_rate) || 4.5,
          wasted: Number(s.default_wasted_time_rate) || 350,
        })
      })
      .catch(() => {})
  }, [defaultHourlyRate])

  // Start with one work item
  const [items, setItems] = useState<BudgetItem[]>(() => [{
    id: genId(),
    type: 'work',
    description: '',
    hours: 10,
    rate: defaultHourlyRate,
  }])

  // Update default rates in existing items when settings load
  useEffect(() => {
    setItems(prev => prev.map(item => {
      if (item.type === 'work' && item.rate === defaultHourlyRate) {
        return { ...item, rate: rates.hourly }
      }
      return item
    }))
  }, [rates.hourly, defaultHourlyRate])

  const addItem = (type: ItemType) => {
    const base: BudgetItem = { id: genId(), type, description: '' }
    switch (type) {
      case 'work':
        base.hours = 0
        base.rate = rates.hourly
        break
      case 'travel':
        base.km = 0
        base.rate_per_km = rates.km
        base.trips = 1
        break
      case 'wasted_time':
        base.hours = 0
        base.rate = rates.wasted
        base.description = 'Čas strávený cestou'
        break
      case 'other':
        base.amount = 0
        break
    }
    setItems(prev => [...prev, base])
  }

  const updateItem = (id: string, changes: Partial<BudgetItem>) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...changes } : item
    ))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const totalBudget = useMemo(() =>
    items.reduce((sum, item) => sum + calcItemTotal(item), 0)
  , [items])

  const totalHours = useMemo(() =>
    items
      .filter(i => i.type === 'work' || i.type === 'wasted_time')
      .reduce((sum, i) => sum + (i.hours || 0), 0)
  , [items])

  // Group totals by type
  const groupTotals = useMemo(() => {
    const groups: Record<ItemType, number> = { work: 0, travel: 0, wasted_time: 0, other: 0 }
    for (const item of items) {
      groups[item.type] += calcItemTotal(item)
    }
    return groups
  }, [items])

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Zadejte název projektu')
      return
    }
    if (items.length === 0) {
      setError('Přidejte alespoň jednu položku')
      return
    }

    setSaving(true)
    setError(null)

    // Compute values for backward compatibility
    const workTotal = groupTotals.work
    const travelTotal = groupTotals.travel + groupTotals.wasted_time
    const otherTotal = groupTotals.other
    const avgRate = items.filter(i => i.type === 'work').length > 0
      ? Math.round(workTotal / Math.max(1, items.filter(i => i.type === 'work').reduce((s, i) => s + (i.hours || 0), 0)))
      : rates.hourly

    try {
      const res = await fetch('/api/prepaid-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          company_name: companyName,
          title: title.trim(),
          description: description.trim() || null,
          estimated_hours: totalHours,
          hourly_rate: avgRate,
          travel_cost: travelTotal,
          other_costs: otherTotal,
          status: alreadyPaid ? 'active' : 'draft',
          payment_status: alreadyPaid ? 'paid' : 'pending',
          budget_items: items.map(item => ({
            type: item.type,
            description: item.description,
            ...(item.type === 'work' || item.type === 'wasted_time' ? { hours: item.hours, rate: item.rate } : {}),
            ...(item.type === 'travel' ? { km: item.km, rate_per_km: item.rate_per_km, trips: item.trips } : {}),
            ...(item.type === 'other' ? { amount: item.amount } : {}),
            total: calcItemTotal(item),
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calculator className="h-4 w-4 text-purple-500" />
          Nový prepaid projekt
        </h4>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        placeholder="Název projektu (např. Audit účetnictví 2025)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />

      {/* Description */}
      <textarea
        placeholder="Popis práce (volitelné)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
      />

      {/* Budget items */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Položky kalkulace</label>

        {items.map(item => (
          <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">
                {ITEM_TYPE_LABELS[item.type]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {calcItemTotal(item).toLocaleString('cs-CZ')} Kč
                </span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              placeholder="Popis položky"
              value={item.description}
              onChange={e => updateItem(item.id, { description: e.target.value })}
              className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            {(item.type === 'work' || item.type === 'wasted_time') && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400">Hodiny</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={item.hours || ''}
                    onChange={e => updateItem(item.id, { hours: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Sazba Kč/hod</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={item.rate || ''}
                    onChange={e => updateItem(item.id, { rate: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            {item.type === 'travel' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400">km (jedním směrem)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.km || ''}
                    onChange={e => updateItem(item.id, { km: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Kč/km</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={item.rate_per_km || ''}
                    onChange={e => updateItem(item.id, { rate_per_km: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400">Počet cest</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={item.trips || 1}
                    onChange={e => updateItem(item.id, { trips: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            {item.type === 'travel' && (item.km || 0) > 0 && (
              <p className="text-[10px] text-gray-400">
                {item.km} km × {item.rate_per_km} Kč × 2 (tam+zpět) × {item.trips || 1} {(item.trips || 1) === 1 ? 'cesta' : 'cesty'}
              </p>
            )}

            {item.type === 'other' && (
              <div>
                <label className="text-[10px] text-gray-400">Částka Kč</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={item.amount || ''}
                  onChange={e => updateItem(item.id, { amount: Number(e.target.value) })}
                  className="w-full px-2 py-1 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </div>
        ))}

        {/* Add item buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(['work', 'travel', 'wasted_time', 'other'] as ItemType[]).map(type => (
            <button
              key={type}
              onClick={() => addItem(type)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Plus className="h-3 w-3" />
              {ITEM_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Already paid checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={alreadyPaid}
          onChange={e => setAlreadyPaid(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Klient již zaplatil</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {alreadyPaid ? '→ automaticky aktivní' : '→ uloží jako koncept'}
        </span>
      </label>

      {/* Total + breakdown */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Celkem k fakturaci</span>
          <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {totalBudget.toLocaleString('cs-CZ')} Kč
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          {groupTotals.work > 0 && <div>Práce: {groupTotals.work.toLocaleString('cs-CZ')} Kč</div>}
          {groupTotals.travel > 0 && <div>Cestovné: {groupTotals.travel.toLocaleString('cs-CZ')} Kč</div>}
          {groupTotals.wasted_time > 0 && <div>Promeškaný čas: {groupTotals.wasted_time.toLocaleString('cs-CZ')} Kč</div>}
          {groupTotals.other > 0 && <div>Ostatní: {groupTotals.other.toLocaleString('cs-CZ')} Kč</div>}
          {totalHours > 0 && <div className="pt-0.5 border-t border-purple-200 dark:border-purple-800 mt-1">Celkem hodin: {totalHours}</div>}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Zrušit
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim() || items.length === 0}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {saving ? 'Vytvářím...' : 'Vytvořit kalkulaci'}
        </button>
      </div>
    </div>
  )
}
