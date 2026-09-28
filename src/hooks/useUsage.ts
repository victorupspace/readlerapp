import { useEffect, useSyncExternalStore } from 'react'
import { api, type UsageResponse } from '../lib/api'

// DeepL character usage for the footer. Refreshed on load, when the window
// regains focus, and a few seconds after translations.

let usage: UsageResponse | null = null
let lastFetch = 0
let pending: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

async function refresh() {
  lastFetch = Date.now()
  try {
    usage = await api.usage()
    listeners.forEach((listener) => listener())
  } catch {
    // The quota line is informative only; keep the last known value.
  }
}

/** Refreshes shortly after the latest call, so a burst of translations costs one request. */
export function scheduleUsageRefresh(delay = 3000): void {
  clearTimeout(pending)
  pending = setTimeout(refresh, delay)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useUsage(): UsageResponse | null {
  useEffect(() => {
    if (!lastFetch) void refresh()
    const onFocus = () => {
      if (Date.now() - lastFetch > 60_000) void refresh()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => usage,
    () => null,
  )
}
