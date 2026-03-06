'use client'

import { AccountantTasksSection } from '@/components/accountant/tasks-section'
import { useCompany } from '../layout'

export default function TasksPage() {
  const { companyId, company, tasks, setTasks } = useCompany()

  return (
    <AccountantTasksSection
      companyId={companyId}
      companyName={company.name}
      tasks={tasks}
      onTasksChange={setTasks}
    />
  )
}
