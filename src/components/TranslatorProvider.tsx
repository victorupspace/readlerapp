import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { navigate } from '../hooks/useHashRoute'
import { addHistoryEntry, updateHistoryEntry, type HistoryEntry, type HistoryFields } from '../hooks/useHistory'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { rememberTranslation, translationKey, useTranslation } from '../hooks/useTranslation'
import { TranslatorContext, type Translator } from '../hooks/useTranslator'
import type { ExplainRequest } from '../lib/api'
import {
  baseLang,
  DEFAULT_FORMALITY,
  DEFAULT_SOURCE,
  DEFAULT_TARGET,
  isFormality,
  isPortuguese,
  isSourceLang,
  isTargetLang,
  supportsFormality,
  toSourceLang,
  toTargetLang,
  type SourceLang,
  type TargetLang,
} from '../lib/languages'
import { STORAGE_KEYS } from '../lib/storage'
import { commonPrefixLength } from '../lib/text'
import type { TranslationResult } from '../types'

interface LanguagePair {
  sourceLang: SourceLang
  targetLang: TargetLang
}

const DEFAULT_PAIR: LanguagePair = { sourceLang: DEFAULT_SOURCE, targetLang: DEFAULT_TARGET }

const isLanguagePair = (value: unknown): value is LanguagePair =>
  typeof value === 'object' &&
  value !== null &&
  isSourceLang((value as LanguagePair).sourceLang) &&
  isTargetLang((value as LanguagePair).targetLang)

interface HistorySession {
  id: string
  text: string
  pair: string
}

/** Typing on, deleting or fixing a word keeps one history entry; a new paste starts another. */
function continuesText(previous: string, next: string): boolean {
  const shared = commonPrefixLength(previous, next)
  return shared >= Math.min(previous.length, next.length) || shared >= 12
}

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const [pair, setPair] = useLocalStorage(STORAGE_KEYS.languages, DEFAULT_PAIR, isLanguagePair)
  const [formality, setFormality] = useLocalStorage(STORAGE_KEYS.formality, DEFAULT_FORMALITY, isFormality)
  const [sourceText, setText] = useState('')
  const [wordFocus, setWordFocus] = useState<ExplainRequest | null>(null)
  const { sourceLang, targetLang } = pair

  // Last foreign target and English variant, to return to them when switching.
  const lastForeignRef = useRef<TargetLang>(isPortuguese(targetLang) ? DEFAULT_TARGET : targetLang)
  const englishRef = useRef<TargetLang>(targetLang === 'EN-GB' ? 'EN-GB' : 'EN-US')
  useEffect(() => {
    if (!isPortuguese(targetLang)) lastForeignRef.current = targetLang
    if (baseLang(targetLang) === 'EN') englishRef.current = targetLang
  }, [targetLang])

  const sessionRef = useRef<HistorySession | null>(null)
  const skipHistoryKeyRef = useRef<string | null>(null)
  // True between picking a target by hand and the next edit of the text.
  const targetPickedRef = useRef(false)

  const recordHistory = useCallback((result: TranslationResult) => {
    const fields: HistoryFields = {
      sourceText: result.text,
      translation: result.translation,
      sourceLang: result.sourceLang,
      detectedLang: result.sourceLang === 'auto' ? result.detectedLang : null,
      targetLang: result.targetLang,
      formality: supportsFormality(result.targetLang) ? result.formality : null,
    }
    const pairKey = `${result.sourceLang}>${result.targetLang}`
    const session = sessionRef.current
    if (
      session &&
      session.pair === pairKey &&
      continuesText(session.text, result.text) &&
      updateHistoryEntry(session.id, fields)
    ) {
      session.text = result.text
      return
    }
    sessionRef.current = { id: addHistoryEntry(fields), text: result.text, pair: pairKey }
  }, [])

  const handleResult = useCallback(
    (result: TranslationResult) => {
      // The text is already in the target language: translate the other way, as DeepL
      // does. A target picked by hand is respected until the text changes.
      if (
        result.sourceLang === 'auto' &&
        !targetPickedRef.current &&
        baseLang(result.detectedLang) === baseLang(result.targetLang)
      ) {
        const flipped = isPortuguese(result.targetLang) ? lastForeignRef.current : 'PT-BR'
        setPair((current) => ({ ...current, targetLang: flipped }))
        return false
      }
      if (skipHistoryKeyRef.current === result.key) {
        skipHistoryKeyRef.current = null
      } else {
        recordHistory(result)
      }
      return true
    },
    [recordHistory, setPair],
  )

  const { result, loading, error, flush } = useTranslation(
    { text: sourceText, sourceLang, targetLang, formality },
    { onResult: handleResult },
  )

  const setSourceText = useCallback((text: string) => {
    setText(text)
    setWordFocus(null)
    targetPickedRef.current = false
  }, [])

  const setSourceLang = useCallback(
    (next: SourceLang) => {
      setWordFocus(null)
      setPair((current) => {
        if (next === 'auto' || baseLang(next) !== baseLang(current.targetLang)) return { ...current, sourceLang: next }
        // Picking the target language as source swaps the two sides.
        const previous = current.sourceLang === 'auto' ? result?.detectedLang : current.sourceLang
        const swapped = previous ? toTargetLang(previous, englishRef.current) : null
        const fallback = next === 'PT' ? lastForeignRef.current : 'PT-BR'
        return {
          sourceLang: next,
          targetLang: swapped && baseLang(swapped) !== baseLang(next) ? swapped : fallback,
        }
      })
    },
    [result?.detectedLang, setPair],
  )

  const setTargetLang = useCallback(
    (next: TargetLang) => {
      setWordFocus(null)
      targetPickedRef.current = true
      setPair((current) => {
        if (current.sourceLang === 'auto' || baseLang(current.sourceLang) !== baseLang(next)) {
          return { ...current, targetLang: next }
        }
        // Picking the source language as target swaps the two sides.
        return { sourceLang: toSourceLang(current.targetLang) ?? 'auto', targetLang: next }
      })
    },
    [setPair],
  )

  const resolvedSource = sourceLang === 'auto' ? (result?.detectedLang ?? null) : sourceLang
  const swapTarget = resolvedSource ? toTargetLang(resolvedSource) : null
  const swapSource = toSourceLang(targetLang)
  const canSwap = swapTarget !== null && swapSource !== null && baseLang(swapTarget) !== swapSource

  const swap = useCallback(() => {
    if (!resolvedSource || !swapSource) return
    const nextTarget = toTargetLang(resolvedSource, englishRef.current)
    if (!nextTarget || baseLang(nextTarget) === swapSource) return
    setPair({ sourceLang: swapSource, targetLang: nextTarget })
    // Move the translation into the source, unless it lags behind what was typed.
    if (result && result.text === sourceText.trim()) setText(result.translation)
    sessionRef.current = null
    setWordFocus(null)
  }, [resolvedSource, result, setPair, sourceText, swapSource])

  const clear = useCallback(() => {
    setText('')
    setWordFocus(null)
    sessionRef.current = null
  }, [])

  const reopen = useCallback(
    (entry: HistoryEntry) => {
      const input = {
        text: entry.sourceText,
        sourceLang: entry.sourceLang,
        targetLang: entry.targetLang,
        formality: entry.formality ?? formality,
      }
      const key = translationKey(input)
      // Seed the cache with the stored translation: reopening costs nothing.
      rememberTranslation({
        ...input,
        key,
        text: entry.sourceText.trim(),
        translation: entry.translation,
        detectedLang: entry.detectedLang ?? entry.sourceLang,
      })
      skipHistoryKeyRef.current = key
      sessionRef.current = null
      setPair({ sourceLang: entry.sourceLang, targetLang: entry.targetLang })
      if (entry.formality) setFormality(entry.formality)
      setText(entry.sourceText)
      setWordFocus(null)
      navigate('translate')
    },
    [formality, setFormality, setPair],
  )

  const value = useMemo<Translator>(
    () => ({
      sourceText,
      setSourceText,
      sourceLang,
      setSourceLang,
      targetLang,
      setTargetLang,
      formality,
      setFormality,
      result,
      loading,
      error,
      translateNow: flush,
      canSwap,
      swap,
      clear,
      reopen,
      wordFocus,
      focusWord: setWordFocus,
    }),
    [
      sourceText,
      setSourceText,
      sourceLang,
      setSourceLang,
      targetLang,
      setTargetLang,
      formality,
      setFormality,
      result,
      loading,
      error,
      flush,
      canSwap,
      swap,
      clear,
      reopen,
      wordFocus,
    ],
  )

  return <TranslatorContext.Provider value={value}>{children}</TranslatorContext.Provider>
}
