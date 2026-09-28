import { useEffect, useSyncExternalStore } from 'react'
import { api } from '../lib/api'

// Whether "Exemplo e contexto" is configured on the server (ANTHROPIC_API_KEY set).
// Asked once per session; until the answer arrives, or if the check fails, the
// feature is assumed to be available.

let available: boolean | null = null
let requested = false
const listeners = new Set<() => void>()

function update(value: boolean) {
  available = value
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
    () => available !== false,
    () => true,
  )
}
