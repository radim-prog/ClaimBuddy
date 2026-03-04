'use client'

import { useState, useRef, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Building2, ChevronsUpDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Company = {
  id: string
  name: string
}

type CompanyComboboxProps = {
  companies: Company[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  allowNone?: boolean
  noneLabel?: string
  className?: string
  triggerClassName?: string
}

export function CompanyCombobox({
  companies,
  value,
  onValueChange,
  placeholder = 'Vyberte klienta',
  allowNone = false,
  noneLabel = 'Všichni klienti',
  className,
  triggerClassName,
}: CompanyComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedCompany = companies.find(c => c.id === value)

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const filtered = search
    ? companies.filter(c => normalize(c.name).includes(normalize(search)))
    : companies

  const handleSelect = (companyId: string) => {
    onValueChange(companyId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between font-normal',
            !value && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">
              {selectedCompany ? selectedCompany.name : (value === 'all' ? noneLabel : placeholder)}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', className)} align="start">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder="Hledat klienta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {allowNone && (
            <button
              onClick={() => handleSelect('all')}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                (value === 'all' || !value) && 'bg-purple-50 dark:bg-purple-900/20'
              )}
            >
              <Check className={cn('h-4 w-4', (value === 'all' || !value) ? 'opacity-100 text-purple-600' : 'opacity-0')} />
              <X className="h-4 w-4 text-gray-400" />
              <span>{noneLabel}</span>
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              Nenalezeno
            </div>
          ) : (
            filtered.map(company => (
              <button
                key={company.id}
                onClick={() => handleSelect(company.id)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  value === company.id && 'bg-purple-50 dark:bg-purple-900/20'
                )}
              >
                <Check className={cn('h-4 w-4', value === company.id ? 'opacity-100 text-purple-600' : 'opacity-0')} />
                <span className="truncate">{company.name}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
