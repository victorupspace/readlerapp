import { createContext, useContext } from 'react'
import type { Formality, SourceLang, TargetLang } from '../lib/languages'
import type { TranslationResult } from '../types'
import type { HistoryEntry } from './useHistory'

/** A word tapped in the reading line, shown in the study margin. */
export interface WordFocus {
  word: string
  /** Language of the word: the language being studied. */
  lang: string
  /** Index of the sentence pair it was tapped in. */
  sentence: number
}

export interface Translator {
  sourceText: string
  setSourceText: (text: string) => void
  sourceLang: SourceLang
  setSourceLang: (lang: SourceLang) => void
  targetLang: TargetLang
  setTargetLang: (lang: TargetLang) => void
  formality: Formality
  setFormality: (formality: Formality) => void

  /** Latest translation shown (it may lag behind the text while typing). */
  result: TranslationResult | null
  loading: boolean
  error: string | null
  translateNow: () => void

  /** The language being studied right now: the side of the pair that isn't Portuguese. */
  studyLang: string

  canSwap: boolean
  swap: () => void
  clear: () => void
  reopen: (entry: HistoryEntry) => void
  /** Loads a saved term into the reader, translating it into Portuguese. */
  openInReader: (term: string, termLang: string) => void

  focus: WordFocus | null
  focusWord: (focus: WordFocus | null) => void
}

export const TranslatorContext = createContext<Translator | null>(null)

export function useTranslator(): Translator {
  const translator = useContext(TranslatorContext)
  if (!translator) throw new Error('useTranslator must be used inside <TranslatorProvider>')
  return translator
}
