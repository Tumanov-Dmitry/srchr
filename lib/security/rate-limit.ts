type RateLimitEntry = {
  count: number
  resetAt: number
}

type HeadersLike = {
  get(name: string): string | null
}

const globalStore = globalThis as typeof globalThis & {
  __srchrRateLimits?: Map<string, RateLimitEntry>
}

const rateLimits = globalStore.__srchrRateLimits ?? new Map<string, RateLimitEntry>()
globalStore.__srchrRateLimits = rateLimits

export function getRequestIdentifier(headers: HeadersLike) {
  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp

  const forwardedFor = headers.get("x-forwarded-for")
  return forwardedFor?.split(",")[0]?.trim() || "unknown"
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateLimits.get(key)

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return { allowed: true, retryAfter: 0 }
}
