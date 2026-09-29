import type { VocabularyDraft } from '../hooks/useVocabulary'
import type { TranslationResult } from '../types'
import type { ExplainRequest } from './api'
import { isPortuguese, studySide } from './languages'

/** Source language of a result: the one chosen, or the one DeepL detected. */
export function resolvedSource(result: TranslationResult): string {
  return result.sourceLang === 'auto' ? result.detectedLang : result.sourceLang
}

/** Request for a Verbete about a translation; null when both sides are Portuguese. */
export function explainRequestFor(result: TranslationResult): ExplainRequest | null {
  const source = resolvedSource(result)
  if (!source || (isPortuguese(source) && isPortuguese(result.targetLang))) return null
  return { text: result.text, translation: result.translation, source_lang: source, target_lang: result.targetLang }
}

export interface Headword {
  /** The expression in the language being studied. */
  text: string
  lang: string
  /** The other side of the pair. */
  gloss: string
  glossLang: string
}

/** Which side of a request is the headword: the study language, the other its gloss. */
export function headwordOf(request: ExplainRequest): Headword {
  const studyIsSource = studySide(request.target_lang) === 'source'
  return {
    text: studyIsSource ? request.text : request.translation,
    lang: studyIsSource ? request.source_lang : request.target_lang,
    gloss: studyIsSource ? request.translation : request.text,
    glossLang: studyIsSource ? request.target_lang : request.source_lang,
  }
}

/**
 * Orders a text/translation pair for the vocabulary: the term is always the
 * side in the language being studied, the translation the other side.
 */
export function studyDraft(text: string, textLang: string, translation: string, translationLang: string): VocabularyDraft {
  return studySide(translationLang) === 'source'
    ? { term: text, termLang: textLang, translation, translationLang }
    : { term: translation, termLang: translationLang, translation: text, translationLang: textLang }
}

export function draftForRequest(request: ExplainRequest): VocabularyDraft {
  return studyDraft(request.text, request.source_lang, request.translation, request.target_lang)
}
