'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Company = {
  id: string
  name: string
  ico: string
  status: string
}

interface CompanyTilesWidgetProps {
  companies: Company[]
  selectedCompanyId: string
  onSelectCompany: (id: string) => void
}

export function CompanyTilesWidget({ companies, selectedCompanyId, onSelectCompany }: CompanyTilesWidgetProps) {
  if (companies.length <= 1) return null

  // 6+ companies → horizontal scroll chips
  if (companies.length >= 6) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">{companies.length} firem</span>
            <Link href="/client/companies/universe" className="text-xs text-primary hover:underline">
              Zobrazit vše <ChevronRight className="h-3 w-3 inline" />
            </Link>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {companies.slice(0, 8).map(company => (
              <button
                key={company.id}
                onClick={() => onSelectCompany(company.id)}
                className={cn(
                  'flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  company.id === selectedCompanyId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {company.name.length > 15 ? company.name.slice(0, 15) + '\u2026' : company.name}
              </button>
            ))}
            {companies.length > 8 && (
              <Link href="/client/companies/universe" className="flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs bg-muted/50 text-muted-foreground">
                +{companies.length - 8}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 2-5 companies → grid cards
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {companies.map(company => (
        <button
          key={company.id}
          onClick={() => onSelectCompany(company.id)}
          className={cn(
            'p-3 rounded-xl border text-left transition-all',
            company.id === selectedCompanyId
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border hover:border-primary/30'
          )}
        >
          <span className="text-sm font-medium truncate block">{company.name}</span>
          <p className="text-[10px] text-muted-foreground">IČO {company.ico}</p>
        </button>
      ))}
    </div>
  )
}
