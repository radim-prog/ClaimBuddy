/**
 * Extraction Queue — Rate-limited concurrent extraction pipeline
 *
 * - Max N concurrent extractions (configurable, default 5)
 * - FIFO queue, documents wait for a free slot
 * - Priority: manual trigger > cron
 * - Progress tracking via polling
 * - Timeout: 60s per document
 */

import { createExtractor, type ExtractedInvoice } from './ai-extractor'
import type { OcrResult } from './ocr-client'

export type ExtractionPriority = 'high' | 'normal' | 'low'

export type ExtractionJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error'
  | 'timeout'

export interface ExtractionJob {
  id: string
  documentId: string
  companyId: string
  fileName: string
  mimeType: string
  priority: ExtractionPriority
  status: ExtractionJobStatus
  progress: number // 0-100
  result?: ExtractedInvoice
  ocrResult?: OcrResult
  error?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  submittedBy?: string
  fastMode?: boolean // Rounds 1+2 only (client mode)
}

type JobResolver = {
  resolve: (job: ExtractionJob) => void
  reject: (error: Error) => void
}

const MAX_CONCURRENT = 5
const JOB_TIMEOUT = 60_000 // 60 seconds
const CLEANUP_INTERVAL = 300_000 // 5 minutes

class ExtractionQueueManager {
  private queue: ExtractionJob[] = []
  private active = new Map<string, ExtractionJob>()
  private completed = new Map<string, ExtractionJob>()
  private resolvers = new Map<string, JobResolver>()
  private buffers = new Map<string, Buffer>()
  private cleanupTimer?: NodeJS.Timeout

  constructor() {
    this.startCleanup()
  }

  /**
   * Submit a document for extraction. Returns a promise that resolves when done.
   */
  async submit(params: {
    documentId: string
    companyId: string
    fileName: string
    mimeType: string
    buffer: Buffer
    priority?: ExtractionPriority
    submittedBy?: string
    fastMode?: boolean
  }): Promise<ExtractionJob> {
    const job: ExtractionJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      documentId: params.documentId,
      companyId: params.companyId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      priority: params.priority || 'normal',
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      submittedBy: params.submittedBy,
      fastMode: params.fastMode,
    }

    this.buffers.set(job.id, params.buffer)

    // Insert in priority order
    const insertIdx = this.queue.findIndex(
      j => priorityValue(j.priority) < priorityValue(job.priority)
    )
    if (insertIdx === -1) {
      this.queue.push(job)
    } else {
      this.queue.splice(insertIdx, 0, job)
    }

    const promise = new Promise<ExtractionJob>((resolve, reject) => {
      this.resolvers.set(job.id, { resolve, reject })
    })

    // Try to process immediately
    this.processNext()

    return promise
  }

  /**
   * Get current queue status
   */
  getStatus(): {
    queueLength: number
    activeCount: number
    completedCount: number
    jobs: ExtractionJob[]
  } {
    return {
      queueLength: this.queue.length,
      activeCount: this.active.size,
      completedCount: this.completed.size,
      jobs: [
        ...this.queue,
        ...Array.from(this.active.values()),
        ...Array.from(this.completed.values()).slice(-20), // Last 20 completed
      ],
    }
  }

  /**
   * Get a specific job by ID
   */
  getJob(jobId: string): ExtractionJob | undefined {
    return (
      this.queue.find(j => j.id === jobId) ||
      this.active.get(jobId) ||
      this.completed.get(jobId)
    )
  }

  /**
   * Cancel a queued job
   */
  cancel(jobId: string): boolean {
    const idx = this.queue.findIndex(j => j.id === jobId)
    if (idx === -1) return false
    const [job] = this.queue.splice(idx, 1)
    job.status = 'error'
    job.error = 'Cancelled'
    this.buffers.delete(job.id)
    this.resolvers.get(job.id)?.reject(new Error('Cancelled'))
    this.resolvers.delete(job.id)
    return true
  }

  private async processNext() {
    while (this.active.size < MAX_CONCURRENT && this.queue.length > 0) {
      const job = this.queue.shift()!
      this.active.set(job.id, job)
      this.processJob(job)
    }
  }

  private async processJob(job: ExtractionJob) {
    const buffer = this.buffers.get(job.id)
    if (!buffer) {
      this.finishJob(job, 'error', undefined, undefined, 'Buffer not found')
      return
    }

    job.status = 'processing'
    job.startedAt = Date.now()
    job.progress = 10

    // Set timeout
    const timeout = setTimeout(() => {
      if (job.status === 'processing') {
        this.finishJob(job, 'timeout', undefined, undefined, 'Extraction timed out (60s)')
      }
    }, JOB_TIMEOUT)

    try {
      const extractor = await createExtractor()

      job.progress = 30

      if (job.fastMode) {
        const { invoice, ocrResult } = await extractor.extractFast(
          buffer, job.fileName, job.mimeType
        )
        job.progress = 90
        clearTimeout(timeout)
        this.finishJob(job, 'completed', invoice, ocrResult)
      } else {
        const { invoice, ocrResult } = await extractor.extractFromFile(
          buffer, job.fileName, job.mimeType
        )
        job.progress = 90
        clearTimeout(timeout)
        this.finishJob(job, 'completed', invoice, ocrResult)
      }
    } catch (error) {
      clearTimeout(timeout)
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error(`[ExtractionQueue] Job ${job.id} failed:`, message)
      this.finishJob(job, 'error', undefined, undefined, message)
    }
  }

  private finishJob(
    job: ExtractionJob,
    status: ExtractionJobStatus,
    result?: ExtractedInvoice,
    ocrResult?: OcrResult,
    error?: string
  ) {
    job.status = status
    job.progress = status === 'completed' ? 100 : job.progress
    job.completedAt = Date.now()
    job.result = result
    job.ocrResult = ocrResult
    job.error = error

    this.active.delete(job.id)
    this.buffers.delete(job.id)
    this.completed.set(job.id, job)

    const resolver = this.resolvers.get(job.id)
    if (resolver) {
      if (status === 'completed') {
        resolver.resolve(job)
      } else {
        resolver.reject(new Error(error || `Job ${status}`))
      }
      this.resolvers.delete(job.id)
    }

    // Process next in queue
    this.processNext()
  }

  private startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const cutoff = Date.now() - 3600_000 // 1 hour
      for (const [id, job] of this.completed) {
        if ((job.completedAt || 0) < cutoff) {
          this.completed.delete(id)
        }
      }
    }, CLEANUP_INTERVAL)
  }

  destroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer)
  }
}

function priorityValue(p: ExtractionPriority): number {
  return p === 'high' ? 3 : p === 'normal' ? 2 : 1
}

// Singleton instance
export const extractionQueue = new ExtractionQueueManager()
