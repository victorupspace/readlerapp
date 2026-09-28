import { useEffect, useSyncExternalStore } from 'react'
import { api } from '../lib/api'
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage'

// Whether the Verbete (Claude) is configured on the server (ANTHROPIC_API_KEY
// set). The last answer is kept in localStorage so the app knows at once on
// the next visit; it is asked again once per session.

let available: boolean | null = readJSON<boolean | null>(
  STORAGE_KEYS.explainAvailable,
  null,
  (value): value is boolean => typeof value === 'boolean',
)
let requested = false
const listeners = new Set<() => void>()

function update(value: boolean) {
  available = value
  writeJSON(STORAGE_KEYS.explainAvailable, value)
  listeners.forEach((listener) => listener())
}

export function markExplainUnavailable(): void {
  update(false)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useExplainAvailable(): boolean {
  useEffect(() => {
    if (requested) return
    requested = true
    api
      .explainStatus()
      .then((status) => update(status.available))
      .catch(() => {})
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => available === true,
    () => false,
  )
}
