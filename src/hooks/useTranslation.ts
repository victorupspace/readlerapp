import { useCallback, useEffect, useRef, useState } from 'react'
import { api, errorMessage, isAbortError } from '../lib/api'
import { isPortuguese, isStudyLang, supportsFormality, toSourceLang, type SourceLang, type TargetLang } from '../lib/languages'
import { STORAGE_KEYS, readJSON, writeJSON } from '../lib/storage'
import type { TranslationInput, TranslationResult } from '../types'

// Long texts wait 600 ms after the last keystroke; a short text, or one that
// just ended in a full stop, waits less. Pasting translates at once.
const DEBOUNCE_MS = 600
const SHORT_DEBOUNCE_MS = 300
const SHORT_TEXT = 24
const CACHE_LIMIT = 300

// Recent results are kept in memory and in localStorage: backspacing to an
// earlier text, flipping formality back, reopening from history or typing the
// same word next week costs no DeepL characters and shows instantly.
const isStoredResults = (value: unknown): value is TranslationResult[] =>
  Array.isArray(value) && value.every((item) => typeof item?.key === 'string' && typeof item?.translation === 'string')

const cache = new Map<string, TranslationResult>(
  readJSON<TranslationResult[]>(STORAGE_KEYS.translateCache, [], isStoredResults).map((item) => [item.key, item]),
)
const wordCache = new Map<string, string>()

// The study language used most recently, the best guess for a lone word that
// DeepL could not place among Readler's four languages.
let lastStudyLang: Exclude<SourceLang, 'auto' | 'PT'> | null = null

let persistTimer: ReturnType<typeof setTimeout> | undefined
function persist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => writeJSON(STORAGE_KEYS.translateCache, [...cache.values()]), 500)
}

export function translationKey(input: TranslationInput): string {
  const formality = supportsFormality(input.targetLang) ? input.formality : ''
  return [input.sourceLang, input.targetLang, formality, input.text.trim()].join('\u0000')
}

export function rememberTranslation(result: TranslationResult): void {
  cache.delete(result.key)
  cache.set(result.key, result)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  persist()
  const source = result.sourceLang === 'auto' ? result.detectedLang : result.sourceLang
  if (isStudyLang(source)) lastStudyLang = toSourceLang(source) as typeof lastStudyLang
}

interface Options {
  /** Called with each new result; returning false discards it (used to switch languages). */
  onResult?: (result: TranslationResult) => boolean
}

/**
 * Translates as you type: after a pause (600 ms, or 300 ms for short texts and
 * finished sentences), right away when a language or the formality changes,
 * and on demand with `flush` (Ctrl/Cmd+Enter, paste).
 * Stale responses are dropped, and in-flight requests are aborted when superseded.
 */
export function useTranslation(input: TranslationInput, { onResult }: Options = {}) {
  const { sourceLang, targetLang, formality } = input
  const text = input.text.trim()
  const key = text ? translationKey(input) : null

  const [result, setResult] = useState<TranslationResult | null>(null)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const [flushCount, setFlushCount] = useState(0)

  const onResultRef = useRef(onResult)
  const latestKeyRef = useRef<string | null>(null)
  const shownKeyRef = useRef<string | null>(null)
  const settingsRef = useRef(`${sourceLang}|${targetLang}|${formality}`)
  const flushRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    onResultRef.current = onResult
  })

  // An empty source clears the translation at once.
  if (!key && result) setResult(null)

  useEffect(() => {
    latestKeyRef.current = key
    if (!key) {
      abortRef.current?.abort()
      shownKeyRef.current = null
      return
    }
    if (key === shownKeyRef.current) {
      abortRef.current?.abort()
      return
    }

    const settings = `${sourceLang}|${targetLang}|${formality}`
    const immediate = flushRef.current || settings !== settingsRef.current || cache.has(key)
    flushRef.current = false
    settingsRef.current = settings

    const show = (next: TranslationResult) => {
      rememberTranslation(next)
      if (latestKeyRef.current !== next.key) return
      if (onResultRef.current?.(next) === false) return
      shownKeyRef.current = next.key
      setResult(next)
      setFailure(null)
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const cached = cache.get(key)
      if (cached) {
        show(cached)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setPendingKey(key)
      try {
        const request = {
          text,
          source_lang: sourceLang === 'auto' ? null : sourceLang,
          target_lang: targetLang,
          formality: supportsFormality(targetLang) ? formality : undefined,
        }
        let response = await api.translate(request, controller.signal)
        let detectedLang = response.detected_source_lang
        // A lone word is easy to misdetect ("jardin" comes back as Spanish).
        // Readler only deals in four languages, so retry with the likeliest.
        if (sourceLang === 'auto' && !toSourceLang(detectedLang) && text.length <= SHORT_TEXT) {
          const guess = isPortuguese(targetLang) ? (lastStudyLang ?? 'EN') : 'PT'
          response = await api.translate({ ...request, source_lang: guess }, controller.signal)
          detectedLang = guess
        }
        show({ key, text, sourceLang, targetLang, formality, translation: response.translation, detectedLang })
      } catch (error) {
        if (!isAbortError(error) && latestKeyRef.current === key) {
          setFailure({ key, message: errorMessage(error) })
        }
      } finally {
        setPendingKey((current) => (current === key ? null : current))
      }
    }, immediate ? 0 : text.length <= SHORT_TEXT || /[.!?…]$/u.test(text) ? SHORT_DEBOUNCE_MS : DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [key, flushCount, text, sourceLang, targetLang, formality])

  const flush = useCallback(() => {
    flushRef.current = true
    setFlushCount((count) => count + 1)
  }, [])

  return {
    result,
    loading: pendingKey !== null,
    error: failure && failure.key === key ? failure.message : null,
    flush,
  }
}

export type WordLookup =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; translation: string }
  | { status: 'error'; error: string }

/** Isolated translation of a single tapped word, cached for the session. */
export function useWordTranslation(word: string | null, from: TargetLang, to: TargetLang | null): WordLookup {
  const key = word && to ? [from, to, word].join('\u0000') : null
  const [state, setState] = useState<{ key: string; translation?: string; error?: string } | null>(null)
  const cached = key ? wordCache.get(key) : undefined

  useEffect(() => {
    if (!key || !word || !to || cached !== undefined) return
    const controller = new AbortController()
    api
      .translate({ text: word, source_lang: toSourceLang(from), target_lang: to }, controller.signal)
      .then((response) => {
        wordCache.set(key, response.translation)
        setState({ key, translation: response.translation })
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setState({ key, error: errorMessage(error) })
      })
    return () => controller.abort()
  }, [key, word, from, to, cached])

  if (!key) return { status: 'idle' }
  if (cached !== undefined) return { status: 'success', translation: cached }
  if (state?.key === key) {
    return state.error !== undefined
      ? { status: 'error', error: state.error }
      : { status: 'success', translation: state.translation ?? '' }
  }
  return { status: 'loading' }
}
