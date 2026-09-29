import { useState } from 'react'
import type { ExamplesRequest, ExplainRequest } from '../lib/api'
import { isStudyLang, toSourceLang, toTargetLang } from '../lib/languages'
import { draftForRequest, explainRequestFor, headwordOf, resolvedSource, studyDraft } from '../lib/study'
import { isShortText, singleWord } from '../lib/text'
import { useExamples } from './useExamples'
import { useExplain, type ExplainState } from './useExplain'
import { useExplainAvailable } from './useExplainAvailable'
import { useTranslation, useWordTranslation } from './useTranslation'
import { useTranslator } from './useTranslator'
import type { VocabularyDraft } from './useVocabulary'

/** Waits for a pause before asking Claude about short texts, so words typed in passing aren't billed. */
const AUTO_DELAY_MS = 700
/** Tatoeba lookups are free: a typed word is looked up after the same pause that triggers its translation. */
const PREFETCH_DELAY_MS = 300

export interface StudySubject {
  /** What the margin is about: a tapped word, the text itself, or nothing yet. */
  kind: 'word' | 'text' | 'none'
  head: string
  headLang: string
  gloss: string | null
  glossLang: string
  glossStatus: 'idle' | 'loading' | 'success' | 'error'
  /** Examples and notes: the Verbete (Claude) when configured, Tatoeba sentences otherwise. */
  entry: ExplainState & { retry: () => void }
  source: 'claude' | 'tatoeba'
  /** A long text with the Verbete configured waits for this before asking Claude. */
  canGenerate: boolean
  generate: () => void
  draft: VocabularyDraft | null
}

/** Resolves what the study margin shows for the current translation and tapped word. */
export function useStudySubject(): StudySubject {
  const { result, error, focus, sourceText, sourceLang } = useTranslator()
  const available = useExplainAvailable()
  const shown = error ? null : result
  const mainRequest = shown ? explainRequestFor(shown) : null
  const textHead = mainRequest ? headwordOf(mainRequest) : null
  const short = shown ? isShortText(shown.text) : false
  const [manualKey, setManualKey] = useState<string | null>(null)

  // A tapped word: its own translation into Portuguese, then its examples.
  const lookup = useWordTranslation(focus?.word ?? null, toTargetLang(focus?.lang ?? 'FR') ?? 'FR', focus ? 'PT-BR' : null)
  const wordGloss = lookup.status === 'success' ? lookup.translation : null

  let claudeRequest: ExplainRequest | null = null
  let tatoebaRequest: ExamplesRequest | null = null
  if (focus) {
    if (available) {
      if (wordGloss) {
        claudeRequest = {
          text: focus.word,
          translation: wordGloss,
          source_lang: toSourceLang(focus.lang) ?? focus.lang,
          target_lang: 'PT-BR',
        }
      }
    } else {
      tatoebaRequest = { word: focus.word, lang: focus.lang }
    }
  } else if (shown && mainRequest && textHead) {
    if (available) {
      if (short || manualKey === shown.key) claudeRequest = mainRequest
    } else {
      const word = singleWord(textHead.text)
      if (word) tatoebaRequest = { word, lang: textHead.lang }
    }
  }
  // The text itself is a subject when it is one word (Tatoeba) or short, or was asked for (Claude).
  const textHasEntry = Boolean(claudeRequest && !focus) || Boolean(tatoebaRequest && !focus)

  const explain = useExplain(claudeRequest, focus || !short ? 0 : AUTO_DELAY_MS)
  const examples = useExamples(tatoebaRequest)

  // Typed word already in a study language: look it up in parallel with the translation.
  const typedWord = !available ? singleWord(sourceText) : null
  const guessedLang = sourceLang !== 'auto' ? sourceLang : result ? resolvedSource(result) : null
  useExamples(typedWord && guessedLang && isStudyLang(guessedLang) ? { word: typedWord, lang: guessedLang } : null, PREFETCH_DELAY_MS)

  const source = available ? 'claude' : 'tatoeba'
  const entry = available ? explain : examples

  if (focus) {
    return {
      kind: 'word',
      head: focus.word,
      headLang: focus.lang,
      gloss: wordGloss,
      glossLang: 'PT-BR',
      glossStatus: lookup.status,
      entry,
      source,
      canGenerate: false,
      generate: () => {},
      draft: wordGloss ? studyDraft(focus.word, focus.lang, wordGloss, 'PT-BR') : null,
    }
  }

  if (shown && mainRequest && textHead && textHasEntry) {
    return {
      kind: 'text',
      head: textHead.text,
      headLang: textHead.lang,
      gloss: textHead.gloss,
      glossLang: textHead.glossLang,
      glossStatus: 'success',
      entry,
      source,
      canGenerate: false,
      generate: () => {},
      draft: draftForRequest(mainRequest),
    }
  }

  return {
    kind: 'none',
    head: '',
    headLang: '',
    gloss: null,
    glossLang: '',
    glossStatus: 'idle',
    entry,
    source,
    canGenerate: Boolean(shown && mainRequest && available && !short && manualKey !== shown.key),
    generate: () => {
      if (shown) setManualKey(shown.key)
    },
    draft: null,
  }
}

// Re-exported so the reader can share one import for its hooks.
export { useTranslation }
