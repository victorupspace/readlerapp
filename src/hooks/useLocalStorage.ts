import { useCallback, useRef, useSyncExternalStore } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

// A tiny shared store over localStorage: every component reading the same key
// sees the same value, updates are synchronous, and other tabs stay in sync.

type Listener = () => void

const listeners = new Map<string, Set<Listener>>()
const snapshots = new Map<string, unknown>()

function notify(key: string) {
  listeners.get(key)?.forEach((listener) => listener())
}

window.addEventListener('storage', (event) => {
  if (event.key && snapshots.has(event.key)) {
    snapshots.delete(event.key)
    notify(event.key)
  }
})

export function getStored<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  if (!snapshots.has(key)) snapshots.set(key, readJSON(key, fallback, isValid))
  return snapshots.get(key) as T
}

export function setStored<T>(key: string, value: T): void {
  snapshots.set(key, value)
  writeJSON(key, value)
  notify(key)
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
  isValid?: (value: unknown) => value is T,
): [T, (next: T | ((previous: T) => T)) => void] {
  const fallbackRef = useRef(fallback)
  const isValidRef = useRef(isValid)

  const subscribe = useCallback(
    (listener: Listener) => {
      let set = listeners.get(key)
      if (!set) listeners.set(key, (set = new Set()))
      set.add(listener)
      return () => {
        set.delete(listener)
      }
    },
    [key],
  )

  const value = useSyncExternalStore(
    subscribe,
    () => getStored(key, fallbackRef.current, isValidRef.current),
    () => fallbackRef.current,
  )

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      const previous = getStored(key, fallbackRef.current, isValidRef.current)
      setStored(key, typeof next === 'function' ? (next as (previous: T) => T)(previous) : next)
    },
    [key],
  )

  return [value, setValue]
}
