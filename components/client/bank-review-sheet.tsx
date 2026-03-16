'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { BankTransaction } from '@/components/client/transaction-list'

// Category labels — filtered by legal form
const ALL_EXPENSE_CATEGORIES = [
  { value: 'business_expense', label: 'Obchodní výdaj', forms: ['all'] },
  { value: 'material', label: 'Materiál', forms: ['all'] },
  { value: 'services', label: 'Služby', forms: ['all'] },
  { value: 'rent', label: 'Nájem', forms: ['all'] },
  { value: 'insurance', label: 'Pojištění', forms: ['all'] },
  { value: 'fuel', label: 'PHM', forms: ['all'] },
  { value: 'salary', label: 'Mzdy', forms: ['sro'] },
  { value: 'social_insurance', label: 'Sociální pojištění', forms: ['osvc'] },
  { value: 'health_insurance', label: 'Zdravotní pojištění', forms: ['osvc'] },
  { value: 'tax_payment', label: 'Daň/Odvody', forms: ['all'] },
  { value: 'loan_repayment', label: 'Splátka úvěru', forms: ['all'] },
  { value: 'private_transfer', label: 'Soukromé', forms: ['osvc'] },
  { value: 'owner_deposit', label: 'Vklad jednatele', forms: ['sro'] },
  { value: 'owner_surcharge', label: 'Příplatek společníka', forms: ['sro'] },
  { value: 'internal_transfer', label: 'Vnitřní převod', forms: ['all'] },
]

const ALL_INCOME_CATEGORIES = [
  { value: 'invoice_income', label: 'Příjem z faktury', forms: ['all'] },
  { value: 'cash_income', label: 'Hotovostní příjem', forms: ['all'] },
  { value: 'other_taxable', label: 'Ostatní zdanitelný', forms: ['all'] },
  { value: 'owner_deposit', label: 'Vklad jednatele', forms: ['sro'] },
  { value: 'loan_received', label: 'Přijatý úvěr', forms: ['all'] },
  { value: 'internal_transfer', label: 'Vnitřní převod', forms: ['all'] },
]

function filterCategories(categories: typeof ALL_EXPENSE_CATEGORIES, legalForm: string) {
  const normalized = (legalForm || '').toLowerCase().replace(/[.\s]/g, '')
  const isSro = normalized === 'sro' || normalized.includes('sro')
  const formKey = isSro ? 'sro' : 'osvc'
  return categories
    .filter(c => c.forms.includes('all') || c.forms.includes(formKey))
    .map(({ value, label }) => ({ value, label }))
}

interface BankReviewSheetProps {
  transactions: BankTransaction[]
  companyId: string
  period: string
  legalForm?: string
  onConfirmed: () => void
  onClose: () => void
}

export function BankReviewSheet({
  transactions,
  companyId,
  period,
  legalForm = '',
  onConfirmed,
  onClose,
}: BankReviewSheetProps) {
  const expenseCategories = filterCategories(ALL_EXPENSE_CATEGORIES, legalForm)
  const incomeCategories = filterCategories(ALL_INCOME_CATEGORIES, legalForm)
  const [categories, setCategories] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const tx of transactions) {
      if (tx.category) initial[tx.id] = tx.category
    }
    return initial
  })
  const [confirming, setConfirming] = useState(false)

  const income = transactions.filter(t => t.amount > 0)
  const expenses = transactions.filter(t => t.amount < 0)
  const matched = transactions.filter(t => t.matched_document_id || t.matched_invoice_id).length
  const totalRevenue = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const res = await fetch('/api/client/bank-statements/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, period, categories }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Potvrzení selhalo')
      }
      toast.success('Výpis potvrzen a uzávěrka aktualizována')
      onConfirmed()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chyba při potvrzení')
    } finally {
      setConfirming(false)
    }
  }

  const setCategory = (txId: string, cat: string) => {
    setCategories(prev => ({ ...prev, [txId]: cat }))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
      <div className="bg-background w-full md:max-w-2xl md:rounded-xl rounded-t-xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Kontrola výpisu — {period}</h2>
            <p className="text-xs text-muted-foreground">
              {transactions.length} transakcí · {matched} spárováno · Příjmy {totalRevenue.toLocaleString('cs')} Kč · Výdaje {totalExpenses.toLocaleString('cs')} Kč
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl px-2">×</button>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Income section */}
          {income.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 flex items-center gap-1 mb-2">
                <ArrowDownLeft className="h-4 w-4" />
                Příjmy ({income.length})
              </h3>
              <div className="space-y-2">
                {income.map(tx => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    category={categories[tx.id] || ''}
                    categoryOptions={incomeCategories}
                    onCategoryChange={cat => setCategory(tx.id, cat)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expense section */}
          {expenses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-2">
                <ArrowUpRight className="h-4 w-4" />
                Výdaje ({expenses.length})
              </h3>
              <div className="space-y-2">
                {expenses.map(tx => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    category={categories[tx.id] || ''}
                    categoryOptions={expenseCategories}
                    onCategoryChange={cat => setCategory(tx.id, cat)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={confirming}>Zrušit</Button>
          <Button onClick={handleConfirm} disabled={confirming}>
            {confirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Potvrdit výpis
          </Button>
        </div>
      </div>
    </div>
  )
}

function TransactionRow({
  tx,
  category,
  categoryOptions,
  onCategoryChange,
}: {
  tx: BankTransaction
  category: string
  categoryOptions: { value: string; label: string }[]
  onCategoryChange: (cat: string) => void
}) {
  const isMatched = !!(tx.matched_document_id || tx.matched_invoice_id)
  const isExpense = tx.amount < 0
  const hasTaxImpact = isExpense && !isMatched && (tx.tax_impact || 0) > 0

  return (
    <div className={cn(
      'rounded-lg border p-3 text-sm',
      isMatched ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' :
      hasTaxImpact ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' :
      'border-border'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isMatched ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : hasTaxImpact ? (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            ) : null}
            <span className="font-medium truncate">{tx.counterparty_name || tx.description || 'Transakce'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{new Date(tx.transaction_date).toLocaleDateString('cs-CZ')}</span>
            {tx.variable_symbol && <span>VS: {tx.variable_symbol}</span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={cn('font-bold', tx.amount > 0 ? 'text-green-600' : 'text-red-600')}>
            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('cs')} Kč
          </span>
          {hasTaxImpact && (
            <Badge variant="outline" className="mt-1 text-[10px] text-red-600 border-red-300">
              Dopad: {((tx.tax_impact || 0) + (tx.vat_impact || 0)).toLocaleString('cs')} Kč
            </Badge>
          )}
        </div>
      </div>

      {/* Category selector (only for unmatched) */}
      {!isMatched && (
        <select
          className="mt-2 w-full h-8 rounded border border-input bg-background px-2 text-xs"
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
        >
          <option value="">Kategorie...</option>
          {categoryOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
