// Everything Readler keeps lives in localStorage under the "readler:" prefix.
export const STORAGE_KEYS = {
  theme: 'readler:theme',
  history: 'readler:history',
  vocabulary: 'readler:vocabulary',
  explainCache: 'readler:explain-cache',
  languages: 'readler:languages',
  formality: 'readler:formality',
  translateCache: 'readler:translate-cache',
  explainAvailable: 'readler:explain-available',
} as const

export function readJSON<T>(key: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return !isValid || isValid(value) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

/** Returns false when storage is unavailable (private mode) or full. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
