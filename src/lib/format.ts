const numberFormat = new Intl.NumberFormat('pt-BR')
const relativeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
const weekdayLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekdayLongYear = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

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

export function formatTime(timestamp: number): string {
  return timeFormat.format(new Date(timestamp))
}

/** Local calendar day, for grouping: "2026-09-28". */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** "Hoje", "Ontem", then "Sexta-feira, 26 de setembro" (with the year when it differs). */
export function formatDayLabel(timestamp: number, now = Date.now()): string {
  const startOfDay = (value: number) => {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  }
  const days = Math.round((startOfDay(now) - startOfDay(timestamp)) / 86_400_000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  const date = new Date(timestamp)
  const label = (date.getFullYear() === new Date(now).getFullYear() ? weekdayLong : weekdayLongYear).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}
