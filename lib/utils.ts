export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatSeconds(seconds: number): string {
  return formatRuntime(Math.floor(seconds / 60))
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMuxThumbnailUrl(playbackId: string, time = 30): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`
}

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAIL ?? '').split(',').map(e => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}

// Only allow http(s) URLs — blocks javascript:, data:, etc. that could execute
// in an admin's session when a submitted link is rendered as an anchor.
export function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
