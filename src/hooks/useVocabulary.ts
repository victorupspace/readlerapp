import { baseLang } from '../lib/languages'
import { createId } from '../lib/misc'
import { STORAGE_KEYS } from '../lib/storage'
import { getStored, setStored, useLocalStorage } from './useLocalStorage'

export interface Example {
  target: string
  pt: string
}

export interface VocabularyEntry {
  id: string
  /** The word or phrase in the language being studied. */
  term: string
  /** DeepL code of the term's language, e.g. "FR", "DE", "EN-GB". */
  termLang: string
  translation: string
  translationLang: string
  example: Example | null
  createdAt: number
}

/** What identifies a term when saving from the translator, the popover or an example. */
export interface VocabularyDraft {
  term: string
  termLang: string
  translation: string
  translationLang: string
}

const EMPTY: VocabularyEntry[] = []
const KEY = STORAGE_KEYS.vocabulary

const isVocabulary = (value: unknown): value is VocabularyEntry[] => Array.isArray(value)

const read = () => getStored(KEY, EMPTY, isVocabulary)

export function findEntry(entries: VocabularyEntry[], term: string, termLang: string): VocabularyEntry | undefined {
  const wanted = term.trim()
  const lang = baseLang(termLang)
  return entries.find((entry) => entry.term === wanted && baseLang(entry.termLang) === lang)
}

/** Saves (or updates) a term. An `example` of undefined keeps the one already saved. */
export function saveEntry(draft: VocabularyDraft, example?: Example | null): VocabularyEntry {
  const entries = read()
  const existing = findEntry(entries, draft.term, draft.termLang)
  const entry: VocabularyEntry = {
    id: existing?.id ?? createId(),
    term: draft.term.trim(),
    termLang: draft.termLang,
    translation: draft.translation.trim(),
    translationLang: draft.translationLang,
    example: example === undefined ? (existing?.example ?? null) : example,
    createdAt: existing?.createdAt ?? Date.now(),
  }
  setStored(KEY, existing ? entries.map((item) => (item.id === entry.id ? entry : item)) : [entry, ...entries])
  return entry
}

export function removeEntry(id: string): void {
  setStored(
    KEY,
    read().filter((entry) => entry.id !== id),
  )
}

/** Saves the term, or removes it when it is already saved. Returns the new saved state. */
export function toggleEntry(draft: VocabularyDraft): boolean {
  const existing = findEntry(read(), draft.term, draft.termLang)
  if (existing) {
    removeEntry(existing.id)
    return false
  }
  saveEntry(draft)
  return true
}

/** Attaches an example to the term (saving the term if needed), or detaches it if already attached. */
export function toggleExample(draft: VocabularyDraft, example: Example): boolean {
  const existing = findEntry(read(), draft.term, draft.termLang)
  if (existing?.example?.target === example.target) {
    saveEntry(draft, null)
    return false
  }
  saveEntry(draft, example)
  return true
}

export function useVocabulary(): VocabularyEntry[] {
  return useLocalStorage(KEY, EMPTY, isVocabulary)[0]
}
