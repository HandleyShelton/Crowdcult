// Rate limiting. Uses Upstash Redis (durable, shared across all serverless
// instances) when configured via UPSTASH_REDIS_REST_URL + _TOKEN; otherwise
// falls back to a best-effort in-memory limiter. Async so the Upstash REST call
// can be awaited.

interface Entry {
  count: number
  resetAt: number
}
const store = new Map<string, Entry>()

function inMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  if (store.size > 5000) {
    for (const [k, v] of store) if (now > v.resetAt) store.delete(k)
  }
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

async function upstash(key: string, limit: number, windowMs: number): Promise<boolean | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const windowId = Math.floor(Date.now() / windowMs)
  const redisKey = `rl:${key}:${windowId}`
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, Math.ceil(windowMs / 1000)],
      ]),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const count = Number(data?.[0]?.result ?? 0)
    return count > 0 && count <= limit
  } catch {
    return null // fall back to in-memory
  }
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const viaUpstash = await upstash(key, limit, windowMs)
  if (viaUpstash !== null) return viaUpstash
  return inMemory(key, limit, windowMs)
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}
