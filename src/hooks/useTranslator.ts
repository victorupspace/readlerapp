import { createContext, useContext } from 'react'
import type { ExplainRequest } from '../lib/api'
import type { Formality, SourceLang, TargetLang } from '../lib/languages'
import type { TranslationResult } from '../types'
import type { HistoryEntry } from './useHistory'

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

  canSwap: boolean
  swap: () => void
  clear: () => void
  reopen: (entry: HistoryEntry) => void

  /** A tapped word shown in "Exemplo e contexto" instead of the whole text. */
  wordFocus: ExplainRequest | null
  focusWord: (request: ExplainRequest) => void
}

export const TranslatorContext = createContext<Translator | null>(null)

export function useTranslator(): Translator {
  const translator = useContext(TranslatorContext)
  if (!translator) throw new Error('useTranslator must be used inside <TranslatorProvider>')
  return translator
}
