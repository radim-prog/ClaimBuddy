'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { UnifiedTaskDetail } from '@/components/work-preview/unified-task-detail'
import { useAccountantUser } from '@/lib/contexts/accountant-user-context'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, userName } = useAccountantUser()
  const taskId = params.id as string
  const fromProject = searchParams.get('from_project')
  const fromType = searchParams.get('from_type')

  if (!userId) {
    return (
      <div className="max-w-6xl">
        <div className="rounded-xl border p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600" />
          <p className="mt-4 text-sm text-muted-foreground">Nacitam uzivatele...</p>
        </div>
      </div>
    )
  }

  return (
    <UnifiedTaskDetail
      taskId={taskId}
      userId={userId}
      userName={userName}
      onBack={() => {
        if (fromProject) {
          const base = fromType === 'legacy'
            ? `/accountant/projects/${fromProject}?tab=ukoly`
            : `/accountant/tasks/${fromProject}?tab=ukoly`
          window.location.href = base
        } else {
          window.location.href = '/accountant/work'
        }
      }}
    />
  )
}
