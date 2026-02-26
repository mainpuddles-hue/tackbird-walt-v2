/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * Usage:
 *   const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 })
 *   // In route handler:
 *   const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
 *   if (limiter.isLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 *
 * Security notes (CIS compliance):
 * - Uses sliding window counter per IP
 * - Automatic cleanup of stale entries to prevent memory exhaustion
 * - Returns standard 429 status code
 * - Max map size capped to prevent OOM in serverless (10,000 entries)
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterOptions {
  /** Maximum requests allowed per window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimiter {
  /** Returns true if the key is rate-limited (should be blocked) */
  isLimited: (key: string) => boolean
  /** Returns remaining requests for the key */
  remaining: (key: string) => number
}

const MAX_MAP_SIZE = 10_000

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { max, windowMs } = options
  const store = new Map<string, RateLimitEntry>()

  function cleanup() {
    if (store.size <= MAX_MAP_SIZE) return
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key)
    }
  }

  function getEntry(key: string): RateLimitEntry {
    const now = Date.now()
    const existing = store.get(key)
    if (existing && existing.resetAt > now) {
      return existing
    }
    // Create new window
    const entry: RateLimitEntry = { count: 0, resetAt: now + windowMs }
    store.set(key, entry)
    return entry
  }

  return {
    isLimited(key: string): boolean {
      cleanup()
      const entry = getEntry(key)
      entry.count++
      if (entry.count > max) {
        return true
      }
      return false
    },
    remaining(key: string): number {
      const now = Date.now()
      const existing = store.get(key)
      if (!existing || existing.resetAt <= now) return max
      return Math.max(0, max - existing.count)
    },
  }
}

// ─── Pre-configured limiters ───────────────────────────────────────
// CIS: rate limiting prevents brute force and DoS attacks

/** Auth: 10 attempts per 15 minutes */
export const authLimiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 })

/** Registration: 5 per hour */
export const registerLimiter = createRateLimiter({ max: 5, windowMs: 60 * 60 * 1000 })

/** Post/event creation: 30 per hour */
export const createLimiter = createRateLimiter({ max: 30, windowMs: 60 * 60 * 1000 })

/** Messages: 60 per minute */
export const messageLimiter = createRateLimiter({ max: 60, windowMs: 60 * 1000 })

/** Reviews: 20 per hour */
export const reviewLimiter = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 })

/** Reports: 10 per hour */
export const reportLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 })

/** Rentals: 20 per hour */
export const rentalLimiter = createRateLimiter({ max: 20, windowMs: 60 * 60 * 1000 })

/** Ads: 10 per hour */
export const adLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 })

/** Global: 200 requests per minute per IP */
export const globalLimiter = createRateLimiter({ max: 200, windowMs: 60 * 1000 })

/** Push subscribe: 10 per hour */
export const subscribeLimiter = createRateLimiter({ max: 10, windowMs: 60 * 60 * 1000 })

// ─── Helper to extract client IP ───────────────────────────────────

export function getClientIp(request: Request): string {
  // x-forwarded-for is set by Vercel/reverse proxies
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP (client IP), not proxy IPs
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// ─── Rate limit response helper ────────────────────────────────────

import { NextResponse } from 'next/server'

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Liian monta pyyntöä — yritä myöhemmin uudelleen' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  )
}
