const numberFormat = new Intl.NumberFormat('pt-BR')
const relativeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** "28 de set." this year, "28 de set. de 2025" otherwise. */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return (date.getFullYear() === new Date().getFullYear() ? dayMonth : dayMonthYear).format(date)
}

/** "agora", "há 5 minutos", "ontem", then a plain date after a week. */
export function formatRelative(timestamp: number, now = Date.now()): string {
  const seconds = Math.round((timestamp - now) / 1000)
  if (Math.abs(seconds) < 45) return 'agora'
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 7) return relativeFormat.format(days, 'day')
  return formatDate(timestamp)
}
