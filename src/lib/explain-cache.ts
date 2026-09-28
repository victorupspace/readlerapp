import type { Explanation, ExplainRequest } from './api'
import { hash } from './misc'
import { normalizeSpaces } from './text'
import { STORAGE_KEYS, readJSON, writeJSON } from './storage'

// Explanations are cached in localStorage so the same lookup is never paid for
// twice. The key covers the text, the language pair and the translation (which
// changes with formality), hashed to keep keys short.

interface CachedExplanation {
  at: number
  value: Explanation
}

type Cache = Record<string, CachedExplanation>

const MAX_ENTRIES = 300
const KEY = STORAGE_KEYS.explainCache

const isCache = (value: unknown): value is Cache =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

let memory: Cache | null = null

function load(): Cache {
  memory ??= readJSON<Cache>(KEY, {}, isCache)
  return memory
}

export function explainKey(request: ExplainRequest): string {
  return hash(
    [request.source_lang, request.target_lang, normalizeSpaces(request.text), normalizeSpaces(request.translation)].join(
      '\u0000',
    ),
  )
}

export function readExplanation(key: string): Explanation | null {
  return load()[key]?.value ?? null
}

export function writeExplanation(key: string, value: Explanation): void {
  const cache = { ...load(), [key]: { at: Date.now(), value } }
  const keys = Object.keys(cache)
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => cache[a].at - cache[b].at)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((old) => delete cache[old])
  }
  memory = cache
  if (!writeJSON(KEY, cache)) {
    // Storage full: keep only the newest half and try once more.
    const newest = Object.entries(cache)
      .sort(([, a], [, b]) => b.at - a.at)
      .slice(0, Math.floor(MAX_ENTRIES / 2))
    memory = Object.fromEntries(newest)
    writeJSON(KEY, memory)
  }
}
