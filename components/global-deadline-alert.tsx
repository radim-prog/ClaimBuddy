'use client'

import { useEffect, useState } from 'react'
import { DeadlineAlertBar } from './deadline-alert-bar'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  ico: string
}

type MonthlyClosure = {
  id: string
  company_id: string
  period: string
  status: string
  bank_statement_status: StatusType
  expense_documents_status: StatusType
  income_invoices_status: StatusType
}

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

function generateDeadlines(closures: MonthlyClosure[], companies: Company[]) {
  const deadlines: Array<{
    id: string
    title: string
    dueDate: string
    type: 'critical' | 'urgent' | 'warning'
    caseId?: string
    companyId?: string
    companyName?: string
    description?: string
    checklist?: Array<{ id: string; label: string; completed: boolean }>
    assignedTo?: string
    attachments?: Array<{ name: string; url: string }>
  }> = []

  const now = new Date()

  closures.forEach(closure => {
    const company = companies.find(c => c.id === closure.company_id)
    if (!company) return

    const [year, month] = closure.period.split('-').map(Number)
    const deadline = new Date(year, month, 15)
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const hasMissing =
      closure.bank_statement_status === 'missing' ||
      closure.expense_documents_status === 'missing' ||
      closure.income_invoices_status === 'missing'

    const hasUploaded =
      closure.bank_statement_status === 'uploaded' ||
      closure.expense_documents_status === 'uploaded' ||
      closure.income_invoices_status === 'uploaded'

    if (hasMissing && daysUntil <= 7) {
      const missingDocs: string[] = []
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      if (closure.bank_statement_status === 'missing') {
        missingDocs.push('výpis')
        checklist.push({ id: `${closure.id}-bank`, label: 'Výpis z banky', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-bank`, label: 'Výpis z banky', completed: true })
      }

      if (closure.expense_documents_status === 'missing') {
        missingDocs.push('náklady')
        checklist.push({ id: `${closure.id}-expense`, label: 'Nákladové doklady', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-expense`, label: 'Nákladové doklady', completed: true })
      }

      if (closure.income_invoices_status === 'missing') {
        missingDocs.push('příjmy')
        checklist.push({ id: `${closure.id}-income`, label: 'Příjmové faktury', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-income`, label: 'Příjmové faktury', completed: true })
      }

      deadlines.push({
        id: `${closure.id}-missing`,
        title: `Uzávěrka ${months[month - 1]} - chybí ${missingDocs.join(', ')}`,
        dueDate: deadline.toISOString(),
        type: daysUntil < 0 ? 'critical' : daysUntil <= 2 ? 'critical' : 'urgent',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name,
        description: `Měsíční uzávěrka za ${months[month - 1]} ${year} pro firmu ${company.name}. Klient musí dodat chybějící dokumenty do ${deadline.toLocaleDateString('cs-CZ')}.`,
        checklist,
        assignedTo: 'Jana Svobodová'
      })
    }

    if (hasUploaded && !hasMissing && daysUntil <= 14) {
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      checklist.push({
        id: `${closure.id}-review-bank`,
        label: 'Zkontrolovat výpis z banky',
        completed: closure.bank_statement_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-review-expense`,
        label: 'Zkontrolovat nákladové doklady',
        completed: closure.expense_documents_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-review-income`,
        label: 'Zkontrolovat příjmové faktury',
        completed: closure.income_invoices_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-approve`,
        label: 'Schválit celou uzávěrku',
        completed: false
      })

      const attachments: Array<{ name: string; url: string }> = []
      if (closure.bank_statement_status === 'uploaded') {
        attachments.push({ name: `vypis_${months[month - 1]}_2025.pdf`, url: '#' })
      }
      if (closure.expense_documents_status === 'uploaded') {
        attachments.push({ name: `naklady_${months[month - 1]}_2025.zip`, url: '#' })
      }
      if (closure.income_invoices_status === 'uploaded') {
        attachments.push({ name: `prijmy_${months[month - 1]}_2025.pdf`, url: '#' })
      }

      deadlines.push({
        id: `${closure.id}-approval`,
        title: `Uzávěrka ${months[month - 1]} - čeká na schválení`,
        dueDate: deadline.toISOString(),
        type: daysUntil <= 3 ? 'urgent' : 'warning',
        caseId: closure.id,
        companyId: company.id,
        companyName: company.name,
        description: `Klient ${company.name} nahrál všechny dokumenty pro uzávěrku za ${months[month - 1]} ${year}. Je třeba zkontrolovat a schválit.`,
        checklist,
        assignedTo: 'Jana Svobodová',
        attachments
      })
    }
  })

  return deadlines.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1
    if (a.type !== 'critical' && b.type === 'critical') return 1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

export function GlobalDeadlineAlert() {
  const [deadlines, setDeadlines] = useState<ReturnType<typeof generateDeadlines>>([])
  const [loading, setLoading] = useState(true)
  const originalTitle = 'Účetní OS'

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accountant/matrix')
        if (!response.ok) return
        const data = await response.json()
        const generated = generateDeadlines(data.closures, data.companies)
        setDeadlines(generated)
      } catch (err) {
        // Silently fail - alert bar just won't show
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Update browser tab title with count of urgent deadlines
  useEffect(() => {
    if (deadlines.length > 0) {
      const criticalCount = deadlines.filter(d => d.type === 'critical').length
      if (criticalCount > 0) {
        document.title = `(${criticalCount}) 🔴 ${originalTitle}`
      } else {
        document.title = `(${deadlines.length}) ${originalTitle}`
      }
    } else {
      document.title = originalTitle
    }

    return () => {
      document.title = originalTitle
    }
  }, [deadlines])

  if (loading || deadlines.length === 0) return null

  return <DeadlineAlertBar deadlines={deadlines} />
}
