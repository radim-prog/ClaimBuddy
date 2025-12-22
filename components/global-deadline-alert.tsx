'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DeadlineAlertBar } from './deadline-alert-bar'
import { ClientsAlertBar } from './clients-alert-bar'
import { ClientDetailAlertBar } from './client-detail-alert-bar'

type StatusType = 'missing' | 'uploaded' | 'approved'

type Company = {
  id: string
  name: string
  group_name?: string | null
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

export type AlertContext = 'dashboard' | 'clients' | 'client-detail' | 'tasks' | 'other'

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

    // Sestavit display name se skupinou
    const displayName = company.group_name
      ? `${company.group_name} – ${company.name}`
      : company.name

    const [year, month] = closure.period.split('-').map(Number)
    // Deadline je 10. den následujícího měsíce po uzávěrkovém období
    const deadline = new Date(year, month, 10)
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const hasMissing =
      closure.bank_statement_status === 'missing' ||
      closure.expense_documents_status === 'missing' ||
      closure.income_invoices_status === 'missing'

    const hasUploaded =
      closure.bank_statement_status === 'uploaded' ||
      closure.expense_documents_status === 'uploaded' ||
      closure.income_invoices_status === 'uploaded'

    // Chybějící dokumenty - zobrazit VŽDY (bez časového limitu)
    if (hasMissing) {
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

      // Určení typu podle urgentnosti
      // critical = po termínu nebo do 3 dnů
      // urgent = do 7 dnů
      // warning = více než 7 dnů
      const alertType: 'critical' | 'urgent' | 'warning' =
        daysUntil < 0 ? 'critical' :
        daysUntil <= 3 ? 'critical' :
        daysUntil <= 7 ? 'urgent' : 'warning'

      deadlines.push({
        id: `${closure.id}-missing`,
        title: `Uzávěrka ${months[month - 1]} - chybí ${missingDocs.join(', ')}`,
        dueDate: deadline.toISOString(),
        type: alertType,
        caseId: closure.id,
        companyId: company.id,
        companyName: displayName,
        description: `Měsíční uzávěrka za ${months[month - 1]} ${year} pro firmu ${displayName}. Klient musí dodat chybějící dokumenty do ${deadline.toLocaleDateString('cs-CZ')}.`,
        checklist,
        assignedTo: 'Jana Svobodová'
      })
    }

    // Nahráno, čeká na schválení - zobrazit VŽDY (bez časového limitu)
    if (hasUploaded && !hasMissing) {
      // Checklist pouze zobrazuje skutečný stav dokumentů (read-only)
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      checklist.push({
        id: `${closure.id}-bank`,
        label: 'Výpis z banky',
        completed: closure.bank_statement_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-expense`,
        label: 'Nákladové doklady',
        completed: closure.expense_documents_status === 'approved'
      })
      checklist.push({
        id: `${closure.id}-income`,
        label: 'Příjmové faktury',
        completed: closure.income_invoices_status === 'approved'
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

      // Určení typu pro schválení
      const approvalType: 'critical' | 'urgent' | 'warning' =
        daysUntil < 0 ? 'urgent' :
        daysUntil <= 3 ? 'urgent' : 'warning'

      deadlines.push({
        id: `${closure.id}-approval`,
        title: `Uzávěrka ${months[month - 1]} - čeká na schválení`,
        dueDate: deadline.toISOString(),
        type: approvalType,
        caseId: closure.id,
        companyId: company.id,
        companyName: displayName,
        description: `Klient ${displayName} nahrál všechny dokumenty pro uzávěrku za ${months[month - 1]} ${year}. Je třeba zkontrolovat a schválit.`,
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
  const pathname = usePathname()
  const [data, setData] = useState<{ companies: Company[], closures: MonthlyClosure[] } | null>(null)
  const [deadlines, setDeadlines] = useState<ReturnType<typeof generateDeadlines>>([])
  const [loading, setLoading] = useState(true)
  const originalTitle = 'Účetní OS'

  // Determine context based on URL
  const context: AlertContext = useMemo(() => {
    if (pathname.match(/\/accountant\/clients\/[^/]+/)) return 'client-detail'
    if (pathname.includes('/accountant/clients')) return 'clients'
    if (pathname.includes('/accountant/tasks')) return 'tasks'
    if (pathname.includes('/accountant/dashboard')) return 'dashboard'
    return 'dashboard' // default to dashboard for other pages
  }, [pathname])

  // Extract companyId from URL if on client detail page
  const companyIdFromUrl = useMemo(() => {
    const match = pathname.match(/\/accountant\/clients\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/accountant/matrix')
        if (!response.ok) return
        const fetchedData = await response.json()
        setData(fetchedData)
        const generated = generateDeadlines(fetchedData.closures, fetchedData.companies)
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

  if (loading || !data) return null

  // Render different alert bar based on context
  switch (context) {
    case 'clients':
      return <ClientsAlertBar companies={data.companies} closures={data.closures} deadlines={deadlines} />

    case 'client-detail':
      if (companyIdFromUrl) {
        // Filter deadlines for this specific client
        const clientDeadlines = deadlines.filter(d => d.companyId === companyIdFromUrl)
        return <ClientDetailAlertBar
          companyId={companyIdFromUrl}
          companies={data.companies}
          closures={data.closures}
          deadlines={clientDeadlines}
        />
      }
      return <DeadlineAlertBar deadlines={deadlines} />

    case 'dashboard':
    case 'tasks':
    default:
      if (deadlines.length === 0) return null
      return <DeadlineAlertBar deadlines={deadlines} />
  }
}
