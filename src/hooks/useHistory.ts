import type { Formality, SourceLang, TargetLang } from '../lib/languages'
import { createId } from '../lib/misc'
import { STORAGE_KEYS } from '../lib/storage'
import { getStored, setStored, useLocalStorage } from './useLocalStorage'

export interface HistoryEntry {
  id: string
  sourceText: string
  translation: string
  /** As chosen in the menu, so "auto" stays "auto" when reopened. */
  sourceLang: SourceLang
  detectedLang: string | null
  targetLang: TargetLang
  formality: Formality | null
  favorite: boolean
  createdAt: number
}

export type HistoryFields = Omit<HistoryEntry, 'id' | 'favorite' | 'createdAt'>

const MAX_ENTRIES = 100
const EMPTY: HistoryEntry[] = []
const KEY = STORAGE_KEYS.history

const isHistory = (value: unknown): value is HistoryEntry[] => Array.isArray(value)

const read = () => getStored(KEY, EMPTY, isHistory)

/** Keeps the last 100 translations, dropping the oldest non-favorites first. */
function trim(entries: HistoryEntry[]): HistoryEntry[] {
  const result = [...entries]
  for (let i = result.length - 1; i >= 0 && result.length > MAX_ENTRIES; i--) {
    if (!result[i].favorite) result.splice(i, 1)
  }
  return result
}

const sameTranslation = (a: HistoryFields, b: HistoryFields) =>
  a.sourceText === b.sourceText &&
  a.sourceLang === b.sourceLang &&
  a.targetLang === b.targetLang &&
  a.formality === b.formality

/** Adds a translation on top; an identical older one moves up instead of duplicating. */
export function addHistoryEntry(fields: HistoryFields): string {
  const entries = read()
  const existing = entries.find((entry) => sameTranslation(entry, fields))
  const entry: HistoryEntry = {
    ...fields,
    id: existing?.id ?? createId(),
    favorite: existing?.favorite ?? false,
    createdAt: Date.now(),
  }
  setStored(KEY, trim([entry, ...entries.filter((item) => item.id !== entry.id)]))
  return entry.id
}

/** Updates an entry in place and moves it to the top. Returns false if it no longer exists. */
export function updateHistoryEntry(id: string, fields: HistoryFields): boolean {
  const entries = read()
  const current = entries.find((entry) => entry.id === id)
  if (!current) return false
  const updated = { ...current, ...fields, createdAt: Date.now() }
  setStored(KEY, [updated, ...entries.filter((entry) => entry.id !== id)])
  return true
}

export function toggleFavorite(id: string): void {
  setStored(
    KEY,
    read().map((entry) => (entry.id === id ? { ...entry, favorite: !entry.favorite } : entry)),
  )
}

export function removeHistoryEntry(id: string): void {
  setStored(
    KEY,
    read().filter((entry) => entry.id !== id),
  )
}

export function useHistory(): HistoryEntry[] {
  return useLocalStorage(KEY, EMPTY, isHistory)[0]
}
