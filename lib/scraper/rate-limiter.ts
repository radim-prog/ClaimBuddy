// Simple rate limiter — enforces minimum delay between requests

export class RateLimiter {
  private lastRequestAt = 0
  private readonly minIntervalMs: number

  constructor(requestsPerSecond = 1) {
    this.minIntervalMs = Math.ceil(1000 / requestsPerSecond)
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestAt
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minIntervalMs - elapsed)
      )
    }
    this.lastRequestAt = Date.now()
  }
}

// Exponential backoff for retries
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('No attempts made')
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}
