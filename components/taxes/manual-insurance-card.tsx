'use client'

function CZK(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ') + ' Kč'
}

interface ManualInsuranceCardProps {
  label: string
  manualBase: number | null
  manualCalculated: number | null
  advancesPaid: number
  onBaseChange: (v: number | null) => void
  onCalculatedChange: (v: number | null) => void
  onAdvancesChange: (v: number) => void
}

export function ManualInsuranceCard({
  label,
  manualBase,
  manualCalculated,
  advancesPaid,
  onBaseChange,
  onCalculatedChange,
  onAdvancesChange,
}: ManualInsuranceCardProps) {
  const due = (manualCalculated ?? 0) - advancesPaid
  const hasData = manualBase != null || manualCalculated != null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end text-sm">
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Vyměřovací základ</label>
          <input
            type="number"
            value={manualBase ?? ''}
            onChange={e => {
              const v = e.target.value
              onBaseChange(v === '' ? null : parseFloat(v) || 0)
            }}
            className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            placeholder="Z formuláře OSSZ/ZP"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Pojistné</label>
          <input
            type="number"
            value={manualCalculated ?? ''}
            onChange={e => {
              const v = e.target.value
              onCalculatedChange(v === '' ? null : parseFloat(v) || 0)
            }}
            className="h-9 w-full px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 text-right"
            placeholder="Z formuláře"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-0.5">Zaplacené zálohy</label>
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
          {hasData ? (
            <div className={`font-bold ${due > 0 ? 'text-red-600 dark:text-red-400' : due < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
              {due > 0 ? '+' : ''}{CZK(due)}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">Vyplňte údaje</div>
          )}
        </div>
      </div>
    </div>
  )
}
