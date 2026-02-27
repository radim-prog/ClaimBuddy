'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PeriodFilterProps = {
  year: number | null
  month: number | null
  onYearChange: (year: number | null) => void
  onMonthChange: (month: number | null) => void
}

const CZECH_MONTHS = [
  'Leden',
  'Unor',
  'Brezen',
  'Duben',
  'Kveten',
  'Cerven',
  'Cervenec',
  'Srpen',
  'Zari',
  'Rijen',
  'Listopad',
  'Prosinec',
]

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y)
  }
  return years
}

export function PeriodFilter({
  year,
  month,
  onYearChange,
  onMonthChange,
}: PeriodFilterProps) {
  const yearOptions = getYearOptions()

  return (
    <div className="flex items-center gap-2">
      {/* Year select */}
      <Select
        value={year !== null ? String(year) : 'all'}
        onValueChange={(val) => onYearChange(val === 'all' ? null : Number(val))}
      >
        <SelectTrigger className="w-[130px] h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
          <SelectValue placeholder="Rok" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Vsechny roky</SelectItem>
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month select */}
      <Select
        value={month !== null ? String(month) : 'all'}
        onValueChange={(val) => onMonthChange(val === 'all' ? null : Number(val))}
      >
        <SelectTrigger className="w-[150px] h-9 rounded-lg text-sm border-gray-200 dark:border-gray-700">
          <SelectValue placeholder="Mesic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Vsechny mesice</SelectItem>
          {CZECH_MONTHS.map((name, idx) => (
            <SelectItem key={idx + 1} value={String(idx + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
