export type SourceLang = 'auto' | 'PT' | 'EN' | 'FR' | 'DE' | 'IT'
export type TargetLang = 'PT-BR' | 'EN-US' | 'EN-GB' | 'FR' | 'DE' | 'IT'
export type Formality = 'prefer_more' | 'prefer_less'

export interface LanguageOption<T extends string> {
  code: T
  label: string
}

export const SOURCE_LANGUAGES: readonly LanguageOption<SourceLang>[] = [
  { code: 'auto', label: 'Detectar idioma' },
  { code: 'PT', label: 'Português' },
  { code: 'EN', label: 'English' },
  { code: 'FR', label: 'Français' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'IT', label: 'Italiano' },
]

export const TARGET_LANGUAGES: readonly LanguageOption<TargetLang>[] = [
  { code: 'PT-BR', label: 'Português (Brasil)' },
  { code: 'EN-US', label: 'English (US)' },
  { code: 'EN-GB', label: 'English (UK)' },
  { code: 'FR', label: 'Français' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'IT', label: 'Italiano' },
]

export const DEFAULT_SOURCE: SourceLang = 'auto'
export const DEFAULT_TARGET: TargetLang = 'FR'
export const DEFAULT_FORMALITY: Formality = 'prefer_more'

export const isSourceLang = (value: unknown): value is SourceLang =>
  SOURCE_LANGUAGES.some((option) => option.code === value)

export const isTargetLang = (value: unknown): value is TargetLang =>
  TARGET_LANGUAGES.some((option) => option.code === value)

export const isFormality = (value: unknown): value is Formality =>
  value === 'prefer_more' || value === 'prefer_less'

/** "EN-GB" → "EN", "pt-br" → "PT". */
export function baseLang(code: string): string {
  return code.slice(0, 2).toUpperCase()
}

export function isPortuguese(code: string): boolean {
  return baseLang(code) === 'PT'
}

/** French, German, English or Italian: the languages being studied. */
export function isStudyLang(code: string): boolean {
  const base = baseLang(code)
  return base === 'FR' || base === 'DE' || base === 'EN' || base === 'IT'
}

/** Formal / informal is offered for French (tu/vous), German (du/Sie) and Italian (tu/Lei). */
export function supportsFormality(target: TargetLang): boolean {
  return target === 'FR' || target === 'DE' || target === 'IT'
}

/** Target code for any language code; English keeps the preferred variant. */
export function toTargetLang(code: string, english: TargetLang = 'EN-US'): TargetLang | null {
  switch (baseLang(code)) {
    case 'PT':
      return 'PT-BR'
    case 'EN':
      return english === 'EN-GB' ? 'EN-GB' : 'EN-US'
    case 'FR':
      return 'FR'
    case 'DE':
      return 'DE'
    case 'IT':
      return 'IT'
    default:
      return null
  }
}

/** Source code for any language code (DeepL source languages have no variants). */
export function toSourceLang(code: string): Exclude<SourceLang, 'auto'> | null {
  const base = baseLang(code)
  return base === 'PT' || base === 'EN' || base === 'FR' || base === 'DE' || base === 'IT' ? base : null
}

const NATIVE_NAMES: Record<string, string> = {
  PT: 'Português',
  EN: 'English',
  FR: 'Français',
  DE: 'Deutsch',
  IT: 'Italiano',
}

const displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'language' })

/** Readable name for any code, including detected languages outside the menu ("Espanhol"). */
export function languageName(code: string): string {
  const base = baseLang(code)
  if (NATIVE_NAMES[base]) return NATIVE_NAMES[base]
  try {
    const name = displayNames.of(base.toLowerCase()) ?? code
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return code
  }
}

/** BCP 47 tag for lang attributes and speech voices. */
export function bcp47(code: string): string {
  switch (code.toUpperCase()) {
    case 'EN-GB':
      return 'en-GB'
    case 'EN':
    case 'EN-US':
      return 'en-US'
    case 'PT':
    case 'PT-BR':
      return 'pt-BR'
    case 'FR':
      return 'fr-FR'
    case 'DE':
      return 'de-DE'
    case 'IT':
      return 'it-IT'
    default:
      return baseLang(code).toLowerCase()
  }
}

/**
 * Which side of a pair holds the language being studied: the non-Portuguese
 * side, or the target when neither side is Portuguese (same rule as the
 * explain Edge Function).
 */
export function studySide(targetLang: string): 'source' | 'target' {
  return isPortuguese(targetLang) ? 'source' : 'target'
}

/** CSS colour naming a language (a token, so it follows the theme). */
export function languageHue(code: string): string {
  switch (baseLang(code)) {
    case 'FR':
      return 'var(--hue-fr)'
    case 'DE':
      return 'var(--hue-de)'
    case 'EN':
      return 'var(--hue-en)'
    case 'IT':
      return 'var(--hue-it)'
    default:
      return 'var(--hue-pt)'
  }
}
