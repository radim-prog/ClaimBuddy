'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DeadlineAlertBar } from './deadline-alert-bar'
import { ClientsAlertBar } from './clients-alert-bar'
import { ClientDetailAlertBar } from './client-detail-alert-bar'
import { useAlertSettings } from '@/lib/contexts/settings-context'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

type StatusType = 'missing' | 'uploaded' | 'approved'

// Typ pro nastavení předaná do funkcí
type AlertSettingsParams = {
  documentCriticalDays: number
  documentUrgentDays: number
  closureDeadlineDay: number
  onboardingStalledDays: number
  onboardingLowProgressPercent: number
  onboardingShowStalled: boolean
}

type Company = {
  id: string
  name: string
  group_name?: string | null
  ico: string
  status?: string
  onboarding?: {
    status: string
    started_at: string
    last_activity_at: string
    assigned_to_name?: string
    priority: 'high' | 'medium' | 'low'
    steps: Array<{
      id: string
      label: string
      completed: boolean
    }>
  }
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

export type AlertContext = 'dashboard' | 'clients' | 'client-detail' | 'tasks' | 'onboarding' | 'hidden' | 'other'

const months = [
  'Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer',
  'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'
]

function generateDeadlines(
  closures: MonthlyClosure[],
  companies: Company[],
  settings: AlertSettingsParams,
  accountantName?: string
) {
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
  // Build lookup map for O(1) company access instead of O(n) find per closure
  const companyMap = new Map(companies.map(c => [c.id, c]))

  closures.forEach(closure => {
    const company = companyMap.get(closure.company_id)
    if (!company) return

    // Sestavit display name se skupinou
    const displayName = company.group_name
      ? `${company.group_name} – ${company.name}`
      : company.name

    const [year, month] = closure.period.split('-').map(Number)
    // Deadline je nastavitelný den následujícího měsíce po uzávěrkovém období
    const deadline = new Date(year, month, settings.closureDeadlineDay)
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
        checklist.push({ id: `${closure.id}-bank`, label: 'Bankovní výpis', completed: false })
      } else {
        checklist.push({ id: `${closure.id}-bank`, label: 'Bankovní výpis', completed: true })
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

      // Určení typu podle urgentnosti (konfigurovatelné prahy)
      const alertType: 'critical' | 'urgent' | 'warning' =
        daysUntil < 0 ? 'critical' :
        daysUntil <= settings.documentCriticalDays ? 'critical' :
        daysUntil <= settings.documentUrgentDays ? 'urgent' : 'warning'

      deadlines.push({
        id: `${closure.id}-missing`,
        title: `Uzávěrka ${months[month - 1]} - chybí ${missingDocs.join(', ')}`,
        dueDate: deadline.toISOString(),
        type: alertType,
        caseId: closure.id,
        companyId: company.id,
        companyName: displayName,
        description: `Měsíční uzávěrka za ${months[month - 1]} ${year} pro firmu ${displayName}. Klient musí dodat chybějící doklady do ${deadline.toLocaleDateString('cs-CZ')}.`,
        checklist,
        assignedTo: accountantName || 'Účetní'
      })
    }

    // Nahráno, ke kontrole - zobrazit VŽDY (bez časového limitu)
    if (hasUploaded && !hasMissing) {
      // Checklist pouze zobrazuje skutečný stav dokumentů (read-only)
      const checklist: Array<{ id: string; label: string; completed: boolean }> = []

      checklist.push({
        id: `${closure.id}-bank`,
        label: 'Bankovní výpis',
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

      // Určení typu pro schválení (konfigurovatelné prahy)
      const approvalType: 'critical' | 'urgent' | 'warning' =
        daysUntil < 0 ? 'urgent' :
        daysUntil <= settings.documentCriticalDays ? 'urgent' : 'warning'

      deadlines.push({
        id: `${closure.id}-approval`,
        title: `Uzávěrka ${months[month - 1]} - ke kontrole`,
        dueDate: deadline.toISOString(),
        type: approvalType,
        caseId: closure.id,
        companyId: company.id,
        companyName: displayName,
        description: `Klient ${displayName} nahrál všechny doklady pro uzávěrku za ${months[month - 1]} ${year}. Je třeba zkontrolovat a schválit.`,
        checklist,
        assignedTo: accountantName || 'Účetní',
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

function generateOnboardingDeadlines(
  companies: Company[],
  settings: AlertSettingsParams
) {
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
  }> = []

  const now = new Date()

  // Filter only onboarding companies
  const onboardingCompanies = companies.filter(c => c.status === 'onboarding' && c.onboarding)

  onboardingCompanies.forEach(company => {
    if (!company.onboarding) return

    const { onboarding } = company
    const lastActivity = new Date(onboarding.last_activity_at)
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate progress
    const totalSteps = onboarding.steps.length
    const completedSteps = onboarding.steps.filter(s => s.completed).length
    const progressPercent = Math.round((completedSteps / totalSteps) * 100)

    // Display name
    const displayName = company.group_name
      ? `${company.group_name} – ${company.name}`
      : company.name

    // Checklist from onboarding steps (first 5 for brevity)
    const checklist = onboarding.steps.slice(0, 5).map(step => ({
      id: step.id,
      label: step.label,
      completed: step.completed
    }))

    // Determine type and create deadline (using configurable thresholds)
    if (settings.onboardingShowStalled && daysSinceActivity >= settings.onboardingStalledDays) {
      // Zaseklý klient - CRITICAL
      deadlines.push({
        id: `onb-stalled-${company.id}`,
        title: `Zaseklý onboarding - ${daysSinceActivity} dní bez aktivity`,
        dueDate: lastActivity.toISOString(), // Use last activity as "due date"
        type: 'critical',
        companyId: company.id,
        companyName: displayName,
        description: `Klient ${displayName} nemá žádnou aktivitu ${daysSinceActivity} dní. Poslední aktivita: ${lastActivity.toLocaleDateString('cs-CZ')}. Postup: ${progressPercent}% (${completedSteps}/${totalSteps} kroků).`,
        checklist,
        assignedTo: onboarding.assigned_to_name
      })
    } else if (onboarding.priority === 'high') {
      // Vysoká priorita - URGENT
      deadlines.push({
        id: `onb-priority-${company.id}`,
        title: `Vysoká priorita - ${progressPercent}% dokončeno`,
        dueDate: now.toISOString(),
        type: 'urgent',
        companyId: company.id,
        companyName: displayName,
        description: `Zavedení klienta ${displayName} má vysokou prioritu. Postup: ${completedSteps}/${totalSteps} kroků dokončeno.`,
        checklist,
        assignedTo: onboarding.assigned_to_name
      })
    } else if (progressPercent < settings.onboardingLowProgressPercent) {
      // Nízký postup - WARNING (konfigurovatelný práh)
      deadlines.push({
        id: `onb-progress-${company.id}`,
        title: `Nízký postup - ${progressPercent}% dokončeno`,
        dueDate: now.toISOString(),
        type: 'warning',
        companyId: company.id,
        companyName: displayName,
        description: `Zavedení klienta ${displayName} má nízký postup. Dokončeno ${completedSteps}/${totalSteps} kroků.`,
        checklist,
        assignedTo: onboarding.assigned_to_name
      })
    }
  })

  return deadlines.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1
    if (a.type !== 'critical' && b.type === 'critical') return 1
    if (a.type === 'urgent' && b.type === 'warning') return -1
    if (a.type === 'warning' && b.type === 'urgent') return 1
    return 0
  })
}

type TaskFromApi = {
  id: string
  title: string
  due_date: string | null
  status: string
  company_id: string | null
  assigned_to_name: string | null
}

function generateTaskDeadlines(
  tasks: TaskFromApi[],
  companies: Company[]
) {
  const deadlines: Array<{
    id: string
    title: string
    dueDate: string
    type: 'critical' | 'urgent' | 'warning'
    companyId?: string
    companyName?: string
    description?: string
    assignedTo?: string
  }> = []

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const companyMap = new Map(companies.map(c => [c.id, c]))

  for (const task of tasks) {
    if (!task.due_date) continue

    const daysUntil = Math.ceil(
      (new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    const alertType: 'critical' | 'urgent' | 'warning' =
      daysUntil < 0 ? 'critical' :
      daysUntil <= 2 ? 'urgent' : 'warning'

    const company = task.company_id ? companyMap.get(task.company_id) : null
    const displayName = company
      ? (company.group_name ? `${company.group_name} – ${company.name}` : company.name)
      : undefined

    deadlines.push({
      id: `task-${task.id}`,
      title: task.title,
      dueDate: task.due_date,
      type: alertType,
      companyId: task.company_id || undefined,
      companyName: displayName,
      description: `Úkol do ${new Date(task.due_date).toLocaleDateString('cs-CZ')}${displayName ? ` — ${displayName}` : ''}`,
      assignedTo: task.assigned_to_name || undefined,
    })
  }

  return deadlines.sort((a, b) => {
    if (a.type === 'critical' && b.type !== 'critical') return -1
    if (a.type !== 'critical' && b.type === 'critical') return 1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

export function GlobalDeadlineAlert() {
  const pathname = usePathname() ?? ''
  const alertSettings = useAlertSettings()
  const { userName } = useAccountantUser()
  const [data, setData] = useState<{ companies: Company[], closures: MonthlyClosure[] } | null>(null)
  const [closureDeadlines, setClosureDeadlines] = useState<ReturnType<typeof generateDeadlines>>([])
  const [taskDeadlines, setTaskDeadlines] = useState<ReturnType<typeof generateTaskDeadlines>>([])
  const [onboardingDeadlines, setOnboardingDeadlines] = useState<ReturnType<typeof generateOnboardingDeadlines>>([])
  const [loading, setLoading] = useState(true)
  const originalTitle = 'Účetní OS'

  // Merge closure + task deadlines, sorted by severity then date
  const deadlines = useMemo(() => {
    const all = [...closureDeadlines, ...taskDeadlines]
    return all.sort((a, b) => {
      const severityOrder = { critical: 0, urgent: 1, warning: 2 }
      const sa = severityOrder[a.type] ?? 2
      const sb = severityOrder[b.type] ?? 2
      if (sa !== sb) return sa - sb
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  }, [closureDeadlines, taskDeadlines])

  // Determine context based on URL
  const context: AlertContext = useMemo(() => {
    if (pathname.match(/\/accountant\/clients\/[^/]+/)) return 'client-detail'
    if (pathname.includes('/accountant/clients')) return 'clients'
    if (pathname.includes('/accountant/onboarding')) return 'onboarding'
    if (pathname.includes('/accountant/tasks')) return 'tasks'
    if (pathname.includes('/accountant/dashboard')) return 'dashboard'
    if (pathname.includes('/accountant/komunikace')) return 'hidden'
    if (pathname.includes('/accountant/inbox')) return 'hidden'
    if (pathname.includes('/accountant/extraction')) return 'hidden'
    if (pathname.includes('/accountant/work-preview')) return 'hidden'
    if (pathname.includes('/accountant/signing')) return 'hidden'
    return 'dashboard'
  }, [pathname])

  // Extract companyId from URL if on client detail page
  const companyIdFromUrl = useMemo(() => {
    const match = pathname.match(/\/accountant\/clients\/([^/]+)/)
    return match ? match[1] : null
  }, [pathname])

  const [rawTasks, setRawTasks] = useState<TaskFromApi[]>([])

  // Fetch data on mount (matrix + tasks in parallel)
  useEffect(() => {
    async function fetchData() {
      try {
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        const dueTo = thirtyDaysFromNow.toISOString().split('T')[0]

        const [matrixRes, tasksRes] = await Promise.all([
          fetch('/api/accountant/matrix'),
          fetch(`/api/tasks?status=pending,in_progress&due_date_to=${dueTo}&sort_by=due_date&sort_order=asc&page_size=100`),
        ])

        if (matrixRes.ok) {
          const fetchedData = await matrixRes.json()
          setData(fetchedData)
        }

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          if (tasksData.tasks) {
            setRawTasks(tasksData.tasks.filter((t: any) => t.due_date))
          }
        }
      } catch {
        // Silently fail - alert bar just won't show
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Regenerate deadlines when data or settings change
  // Use individual settings values as dependencies to avoid infinite loop
  const {
    documentCriticalDays,
    documentUrgentDays,
    closureDeadlineDay,
    onboardingStalledDays,
    onboardingLowProgressPercent,
    onboardingShowStalled,
    isLoaded: settingsLoaded
  } = alertSettings

  useEffect(() => {
    if (data && settingsLoaded) {
      const settingsParams = {
        documentCriticalDays,
        documentUrgentDays,
        closureDeadlineDay,
        onboardingStalledDays,
        onboardingLowProgressPercent,
        onboardingShowStalled
      }
      // Generuj deadlines z uzávěrek
      const closureGen = generateDeadlines(data.closures, data.companies, settingsParams, userName)
      setClosureDeadlines(closureGen)
      // Generuj deadlines z onboardingu
      const onbGenerated = generateOnboardingDeadlines(data.companies, settingsParams)
      setOnboardingDeadlines(onbGenerated)
      // Generuj deadlines z úkolů
      if (rawTasks.length > 0) {
        setTaskDeadlines(generateTaskDeadlines(rawTasks, data.companies))
      }
    }
  }, [data, rawTasks, settingsLoaded, documentCriticalDays, documentUrgentDays, closureDeadlineDay, onboardingStalledDays, onboardingLowProgressPercent, onboardingShowStalled, userName])

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

  if (loading || !data || !settingsLoaded) return null

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

    case 'onboarding':
      if (onboardingDeadlines.length === 0) return null
      return <DeadlineAlertBar deadlines={onboardingDeadlines} />

    case 'tasks':
      if (taskDeadlines.length === 0) return null
      return <DeadlineAlertBar deadlines={taskDeadlines} />

    case 'hidden':
      return null

    case 'dashboard':
    default:
      // Na dashboardu zobrazit vše (uzávěrky + úkoly)
      if (deadlines.length === 0) return null
      return <DeadlineAlertBar deadlines={deadlines} />
  }
}
