import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Fallback in-memory rate limiter pro development (bez Upstash)
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.maxRequests = limit;
    this.window = windowMs;
  }

  async limit(identifier: string) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter out old requests outside window
    const recentRequests = userRequests.filter(time => now - time < this.window);

    if (recentRequests.length >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.min(...recentRequests) + this.window,
      };
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - recentRequests.length,
      reset: now + this.window,
    };
  }
}

// Production: Upstash Redis rate limiter
function createUpstashLimiter(requests: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('⚠️ Upstash credentials not found, using in-memory rate limiter');
    return null;
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: 'claimbuddy',
  });
}

// Parse window string like "1 h" to milliseconds
function parseWindow(window: Parameters<typeof Ratelimit.slidingWindow>[1]): number {
  const [amount, unit] = window.split(' ');
  const num = parseInt(amount);

  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return 60 * 1000; // default 1 min
  }
}

// Rate limiters for different endpoints
export const rateLimiters = {
  // OCR: 10 requests per hour (expensive)
  ocr: createUpstashLimiter(10, '1 h') ||
       new InMemoryRateLimiter(10, parseWindow('1 h')),

  // AI Chat: 50 requests per hour
  chat: createUpstashLimiter(50, '1 h') ||
        new InMemoryRateLimiter(50, parseWindow('1 h')),

  // General API: 100 requests per 15 minutes
  api: createUpstashLimiter(100, '15 m') ||
       new InMemoryRateLimiter(100, parseWindow('15 m')),

  // Auth: 5 attempts per 15 minutes (prevent brute force)
  auth: createUpstashLimiter(5, '15 m') ||
        new InMemoryRateLimiter(5, parseWindow('15 m')),
};

// Helper to check rate limit and return response if exceeded
export async function checkRateLimit(
  limiter: Ratelimit | InMemoryRateLimiter,
  identifier: string
) {
  const result = await (limiter as any).limit(identifier);

  return {
    success: Boolean(result?.success),
    limit: Number(result?.limit ?? 0),
    remaining: Number(result?.remaining ?? 0),
    reset: Number(result?.reset ?? Date.now()),
  };
}

// Error response for rate limit exceeded
export function rateLimitExceeded(reset: number) {
  const resetDate = new Date(reset);
  return Response.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again after ${resetDate.toLocaleTimeString('cs-CZ')}`,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Reset': String(reset),
      },
    }
  );
}
