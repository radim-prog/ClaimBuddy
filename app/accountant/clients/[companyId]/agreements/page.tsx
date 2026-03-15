'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Calculator, Info, AlertTriangle, ChevronDown, ChevronRight,
  TrendingDown, FileText, Clock, Banknote, Search, Download, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompany, type Company } from '../layout'
import { CONTRACT_TYPE_LABELS, WAGE_TYPE_LABELS, type Employee } from '@/lib/types/employee'
import {
  calculateAgreementTaxImpact,
  AGREEMENT_INFO,
  DPP_ANNUAL_LIMIT,
  DPP_YEARLY_LIMIT,
  DPC_MONTHLY_LIMIT,
  DPC_HOURS_LIMIT,
  type AgreementTaxImpact,
} from '@/lib/agreement-utils'

export default function AgreementsPage() {
  const { employees, company } = useCompany()
  const [calcGross, setCalcGross] = useState('8000')
  const [calcTaxDecl, setCalcTaxDecl] = useState(true)
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Filter only DPP/DPČ workers
  const agreementWorkers = useMemo(() => {
    const workers = employees.filter(e => e.contract_type === 'dpp' || e.contract_type === 'dpc')
    if (!search.trim()) return workers
    const q = search.toLowerCase()
    return workers.filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q)
    )
  }, [employees, search])

  const dppCount = agreementWorkers.filter(e => e.contract_type === 'dpp').length
  const dpcCount = agreementWorkers.filter(e => e.contract_type === 'dpc').length
  const activeCount = agreementWorkers.filter(e => e.active && !e.employment_end).length

  // Tax impact calculation
  const grossNum = parseInt(calcGross) || 0
  const taxImpact = grossNum > 0 ? calculateAgreementTaxImpact(grossNum, calcTaxDecl) : null

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Users}
          label="Dohodáři celkem"
          value={agreementWorkers.length}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          icon={FileText}
          label="DPP"
          value={dppCount}
          color="text-purple-600"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
        <SummaryCard
          icon={FileText}
          label="DPČ"
          value={dpcCount}
          color="text-indigo-600"
          bgColor="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <SummaryCard
          icon={Clock}
          label="Aktivní"
          value={activeCount}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* Workers list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Evidence dohodářů
            </CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Hledat..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {agreementWorkers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {employees.some(e => e.contract_type === 'dpp' || e.contract_type === 'dpc')
                  ? 'Žádní dohodáři neodpovídají hledání.'
                  : 'Tato firma nemá žádné zaměstnance na dohodu (DPP/DPČ).'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Dohodáře lze přidat v sekci Firma &rarr; Zaměstnanci.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agreementWorkers.map(worker => (
                <WorkerRow key={worker.id} worker={worker} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax impact calculator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-green-600" />
            Kalkulačka daňového dopadu
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Porovnání nákladů zaměstnavatele: HPP vs. DPP pro stejnou hrubou odměnu
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Hrubá odměna:</label>
              <div className="relative">
                <Input
                  type="number"
                  value={calcGross}
                  onChange={e => setCalcGross(e.target.value)}
                  className="h-8 w-32 text-sm pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Kč</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Prohlášení k dani:</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalcTaxDecl(true)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    calcTaxDecl ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200'
                  )}
                >
                  Ano
                </button>
                <button
                  onClick={() => setCalcTaxDecl(false)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    !calcTaxDecl ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200'
                  )}
                >
                  Ne
                </button>
              </div>
            </div>
          </div>

          {taxImpact && <TaxImpactResult impact={taxImpact} />}
        </CardContent>
      </Card>

      {/* DPP/DPČ info / education */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Informace o dohodách
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {(['dpp', 'dpc'] as const).map(type => {
            const info = AGREEMENT_INFO[type]
            const expanded = expandedInfo === type
            return (
              <div key={type} className="border rounded-lg">
                <button
                  onClick={() => setExpandedInfo(expanded ? null : type)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="font-medium text-sm">{info.title}</span>
                  {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                {expanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5">Pravidla</h4>
                      <ul className="space-y-1">
                        {info.rules.map((rule, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Upozornění
                      </h4>
                      <ul className="space-y-1">
                        {info.warnings.map((warning, i) => (
                          <li key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Sub-components ---

function SummaryCard({ icon: Icon, label, value, color, bgColor }: {
  icon: React.ElementType; label: string; value: number; color: string; bgColor: string
}) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bgColor)}>
            <Icon className={cn('h-4 w-4', color)} />
          </div>
          <div>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkerRow({ worker }: { worker: Employee }) {
  const [downloading, setDownloading] = useState(false)
  const isActive = worker.active && !worker.employment_end
  const isDPP = worker.contract_type === 'dpp'
  const impact = calculateAgreementTaxImpact(worker.base_salary, worker.tax_declaration)

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/accountant/agreements/pdf?employee_id=${worker.id}`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${isDPP ? 'DPP' : 'DPC'}_${worker.last_name}_${worker.first_name}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
          isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
        )}>
          {worker.first_name[0]}{worker.last_name[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{worker.first_name} {worker.last_name}</span>
            <Badge variant="outline" className={cn(
              'text-[10px]',
              isDPP ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'
            )}>
              {isDPP ? 'DPP' : 'DPČ'}
            </Badge>
            {!isActive && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">Ukončen</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {worker.position} &middot; {worker.wage_type === 'hourly' ? `${worker.hourly_rate || worker.base_salary} Kč/h` : `${worker.base_salary.toLocaleString('cs-CZ')} Kč/měs`}
            {worker.employment_start && ` &middot; od ${new Date(worker.employment_start).toLocaleDateString('cs-CZ')}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {impact.noInsurance && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px]">
            Bez odvodů
          </Badge>
        )}
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Úspora zaměstnavatele</p>
          <p className={cn('text-sm font-bold', impact.employerSaving > 0 ? 'text-green-600' : 'text-muted-foreground')}>
            {impact.employerSaving > 0 ? `${impact.employerSaving.toLocaleString('cs-CZ')} Kč` : '0 Kč'}
            {impact.savingPercent > 0 && <span className="text-xs font-normal ml-1">({impact.savingPercent}%)</span>}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={downloadPDF} disabled={downloading} title="Stáhnout dohodu (PDF)">
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

function TaxImpactResult({ impact }: { impact: AgreementTaxImpact }) {
  return (
    <div className="space-y-3">
      {/* Status badge */}
      {impact.noInsurance && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <TrendingDown className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">
            Odměna do {DPP_ANNUAL_LIMIT.toLocaleString('cs-CZ')} Kč/měs — bez odvodů sociálního a zdravotního pojištění
          </span>
        </div>
      )}

      {/* Comparison table */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Hrubá odměna</p>
          <p className="text-lg font-bold">{impact.gross.toLocaleString('cs-CZ')} Kč</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Náklady HPP</p>
          <p className="text-lg font-bold text-red-600">{impact.employerCostHPP.toLocaleString('cs-CZ')} Kč</p>
          <p className="text-[10px] text-muted-foreground">čistá mzda: {impact.workerNetHPP.toLocaleString('cs-CZ')} Kč</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Náklady DPP</p>
          <p className="text-lg font-bold text-green-600">{impact.employerCostDPP.toLocaleString('cs-CZ')} Kč</p>
          <p className="text-[10px] text-muted-foreground">čistá odměna: {impact.workerNetDPP.toLocaleString('cs-CZ')} Kč</p>
        </div>
      </div>

      {/* Saving highlight */}
      {impact.employerSaving > 0 && (
        <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-green-100/60 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
          <Banknote className="h-5 w-5 text-green-600" />
          <div className="text-center">
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              Úspora: {impact.employerSaving.toLocaleString('cs-CZ')} Kč/měsíc ({impact.savingPercent}%)
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/60">
              Roční úspora: ~{(impact.employerSaving * 12).toLocaleString('cs-CZ')} Kč
            </p>
          </div>
        </div>
      )}

      {/* Detail breakdown */}
      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-8 gap-y-0.5 pt-2 border-t">
        <span>SP zaměstnavatel (DPP): {impact.socialInsuranceEmployer.toLocaleString('cs-CZ')} Kč</span>
        <span>ZP zaměstnavatel (DPP): {impact.healthInsuranceEmployer.toLocaleString('cs-CZ')} Kč</span>
      </div>
    </div>
  )
}
