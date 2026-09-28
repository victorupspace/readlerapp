import type { Formality, SourceLang, TargetLang } from './lib/languages'

export interface TranslationInput {
  text: string
  sourceLang: SourceLang
  targetLang: TargetLang
  formality: Formality
}

export interface TranslationResult extends TranslationInput {
  key: string
  /** The trimmed source text that was translated. */
  text: string
  translation: string
  /** Source language reported by DeepL (also when the source was chosen). */
  detectedLang: string
}
