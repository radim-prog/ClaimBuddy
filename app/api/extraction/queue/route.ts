import { NextRequest, NextResponse } from 'next/server'
import { extractionQueue } from '@/lib/extraction-queue'

export const dynamic = 'force-dynamic'

/**
 * GET /api/extraction/queue
 * Get current extraction queue status with step-level progress
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const status = extractionQueue.getStatus()

  return NextResponse.json({
    queueLength: status.queueLength,
    activeCount: status.activeCount,
    completedCount: status.completedCount,
    jobs: status.jobs.map(j => ({
      id: j.id,
      documentId: j.documentId,
      companyId: j.companyId,
      fileName: j.fileName,
      status: j.status,
      progress: j.progress,
      priority: j.priority,
      error: j.error,
      currentStep: j.currentStep,
      stepStartedAt: j.stepStartedAt,
      steps: j.steps,
      createdAt: j.createdAt,
      startedAt: j.startedAt,
      completedAt: j.completedAt,
      submittedBy: j.submittedBy,
      confidence: j.result?.confidence_score,
    })),
  })
}
