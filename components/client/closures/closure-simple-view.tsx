'use client'

import { Button } from '@/components/ui/button'
import { ClosureProgressRing } from '@/components/client/closures/closure-progress-bar'
import { TaxImpactInline } from '@/components/client/closures/tax-impact-inline'
import { ClosureTabs, ClosureTabContent } from '@/components/client/closures/closure-tabs'
import { ClosureSummaryTab } from '@/components/client/closures/closure-summary-tab'
import { ClosureBankTab } from '@/components/client/closures/closure-bank-tab'
import { ClosureDocumentsTab } from '@/components/client/closures/closure-documents-tab'
import { ClosureInvoicesTab } from '@/components/client/closures/closure-invoices-tab'
import { cn } from '@/lib/utils'
import { Upload, CheckCircle2, ChevronDown, Inbox } from 'lucide-react'
import { useState } from 'react'

const fmtCZK = (n: number) => Math.round(Math.abs(n)).toLocaleString('cs-CZ')

interface SummaryData {
  period: string
  progress: number
  financials: { income: number; expense: number; cash_income: number; cash_expense: number; net: number }
  matching: { total: number; matched: number; auto_matched: number; manual_matched: number; suggested: number; unmatched: number; private: number; recurring: number }
  documents: { total: number; approved: number; pending: number }
  tax_impact: { income_tax: number; vat: number; social_insurance: number; health_insurance: number; total: number }
  actions: string[]
}

interface TiersData {
  auto: { transactions: any[]; count: number }
  suggestions: { transactions: any[]; count: number }
  unmatched: { transactions: any[]; count: number }
  private: { transactions: any[]; count: number }
}

interface UnmatchedData {
  expenses: { transactions: any[]; count: number; total_amount: number }
  income: { transactions: any[]; count: number; total_amount: number }
  tax_impact: { total: number }
}

interface ClosureSimpleViewProps {
  summary: SummaryData
  tiers: TiersData | null
  unmatched: UnmatchedData | null
  companyId: string
  period: string
  monthName: string
  year: number
  onRefresh: () => void
  onUpload: () => void
}

export function ClosureSimpleView({ summary, tiers, unmatched, companyId, period, monthName, year, onRefresh, onUpload }: ClosureSimpleViewProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const missingExpenses = unmatched?.expenses.transactions || []
  const missingCount = missingExpenses.length
  const totalTaxImpact = unmatched?.tax_impact.total || 0
  const totalTxns = (tiers?.auto.count || 0) + (tiers?.suggestions.count || 0) + (tiers?.unmatched.count || 0) + (tiers?.private.count || 0)
  const isComplete = summary.progress >= 100 && missingCount === 0
  const noData = summary.matching.total === 0

  return (
    <div className="space-y-4">
      {/* 1. Hero banner */}
      {noData ? (
        <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center">
          <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground font-medium">Zatím žádné transakce za {monthName}</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Stačí nahrát bankovní výpis pro zahájení uzávěrky</p>
          <Button size="sm" className="mt-3" onClick={onUpload}>
            <Upload className="h-4 w-4 mr-1.5" />
            Nahrát výpis
          </Button>
        </div>
      ) : isComplete ? (
        <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-5 flex items-center gap-4">
          <ClosureProgressRing value={100} size={56} />
          <div className="flex-1">
            <p className="text-lg font-semibold text-green-800 dark:text-green-300">
              Všechny doklady za {monthName} v pořádku
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-0.5">
              {summary.matching.matched}/{summary.matching.total} transakcí spárováno
            </p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
        </div>
      ) : (
        <div className={cn(
          'rounded-xl p-5 flex items-center gap-4',
          totalTaxImpact > 0
            ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
        )}>
          <div title={`Dokončeno ${summary.progress}% — podíl spárovaných transakcí`}>
            <ClosureProgressRing value={summary.progress} size={56} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-lg font-semibold',
              totalTaxImpact > 0 ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'
            )}>
              Zbývá nahrát {missingCount} {missingCount === 1 ? 'doklad' : missingCount < 5 ? 'doklady' : 'dokladů'}
            </p>
            <p className={cn('text-xs mt-1', totalTaxImpact > 0 ? 'text-red-600/70 dark:text-red-400/70' : 'text-amber-700/70 dark:text-amber-400/70')}>
              Ke každému výdaji na účtu potřebujeme doklad. Bez něj nelze výdaj uplatnit jako náklad.
            </p>
            {totalTaxImpact > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">
                Daňový dopad: <span className="font-semibold">{fmtCZK(totalTaxImpact)} Kč</span>
                <span className="text-xs font-normal ml-1 opacity-70">— tolik můžete ušetřit nahráním dokladů</span>
              </p>
            )}
          </div>
          <Button size="sm" onClick={onUpload}>
            <Upload className="h-4 w-4 mr-1.5" />
            Nahrát doklad
          </Button>
        </div>
      )}

      {/* 2. Missing documents list */}
      {!noData && missingCount > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Doklady k doplnění</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tyto výdaje z vašeho bankovního výpisu nemají přiřazený doklad. Stačí nahrát doklad (účtenku, fakturu) ke každému výdaji.
            </p>
          </div>
          <div className="divide-y">
            {missingExpenses.map((tx: any) => (
              <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.counterparty_name || tx.description || 'Neznámý příjemce'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.transaction_date).toLocaleDateString('cs-CZ')} · {tx.description}
                  </p>
                </div>
                <span className="text-sm font-mono font-medium shrink-0">
                  {fmtCZK(tx.amount)} Kč
                </span>
                {tx.total_impact > 0 && (
                  <TaxImpactInline total={tx.total_impact} showIcon={false} />
                )}
                <Button variant="outline" size="sm" className="shrink-0" onClick={onUpload} title="Stačí nahrát účtenku nebo fakturu k tomuto výdaji">
                  Nahrát
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!noData && missingCount === 0 && !isComplete && (
        <div className="rounded-lg border bg-card px-4 py-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Všechny výdaje mají doklad</p>
        </div>
      )}

      {/* 3. Collapsible detail */}
      {!noData && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <button
            onClick={() => setDetailOpen(!detailOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <div>
              <span>Zobrazit detaily ({totalTxns} transakcí)</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">Detailní pohled na bankovní transakce, doklady a faktury za tento měsíc</p>
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', detailOpen && 'rotate-180')} />
          </button>
          {detailOpen && (
            <div className="border-t px-2 py-4">
              <ClosureTabs>
                <ClosureTabContent value="overview">
                  <ClosureSummaryTab data={summary} onAction={() => {}} />
                </ClosureTabContent>
                <ClosureTabContent value="bank">
                  {tiers ? (
                    <ClosureBankTab tiers={tiers} companyId={companyId} period={period} onRefresh={onRefresh} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Žádné bankovní transakce</p>
                  )}
                </ClosureTabContent>
                <ClosureTabContent value="documents">
                  <ClosureDocumentsTab
                    documents={summary.documents}
                    unmatchedExpenses={missingExpenses}
                    totalTaxImpact={totalTaxImpact}
                    onUpload={onUpload}
                  />
                </ClosureTabContent>
                <ClosureTabContent value="invoices">
                  <ClosureInvoicesTab
                    matchedCount={summary.matching.auto_matched + summary.matching.manual_matched}
                    unmatchedIncome={unmatched?.income.transactions || []}
                    totalIncome={summary.financials.income}
                  />
                </ClosureTabContent>
              </ClosureTabs>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
