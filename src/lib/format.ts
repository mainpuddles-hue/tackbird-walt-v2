/**
 * Format a date string as a relative time in Finnish.
 */
export function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'juuri nyt'
  if (diffMin < 60) return `${diffMin} min sitten`
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'tunti' : 'tuntia'} sitten`
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'päivä' : 'päivää'} sitten`
  if (diffWeek < 5) return `${diffWeek} ${diffWeek === 1 ? 'viikko' : 'viikkoa'} sitten`

  return date.toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

/**
 * Format price in Finnish locale: "10,00 €"
 */
export function formatPrice(amount: number): string {
  return amount.toLocaleString('fi-FI', {
    style: 'currency',
    currency: 'EUR',
  })
}

/**
 * Format a number in Finnish locale: "1 000"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('fi-FI')
}

/**
 * Format response rate: null → "-", value → "98 %"
 */
export function formatResponseRate(rate: number | null | undefined): string {
  if (rate == null) return '-'
  return `${rate} %`
}

/**
 * Format event date: "maanantai 3. maaliskuuta 2026"
 */
export function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format short event date: "ma 3.3."
 */
export function formatEventDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fi-FI', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  })
}
