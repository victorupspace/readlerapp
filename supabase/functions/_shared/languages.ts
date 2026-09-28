// DeepL codes supported by Readler. Source codes have no regional variant.
export const SOURCE_LANGS = ["PT", "EN", "FR", "DE"] as const;
export const TARGET_LANGS = ["PT-BR", "EN-US", "EN-GB", "FR", "DE"] as const;

export type SourceLang = (typeof SOURCE_LANGS)[number];
export type TargetLang = (typeof TARGET_LANGS)[number];

export function isSourceLang(value: unknown): value is SourceLang {
  return SOURCE_LANGS.includes(value as SourceLang);
}

export function isTargetLang(value: unknown): value is TargetLang {
  return TARGET_LANGS.includes(value as TargetLang);
}

const NAMES: Record<string, string> = {
  PT: "Portuguese",
  "PT-BR": "Brazilian Portuguese",
  EN: "English",
  "EN-US": "American English",
  "EN-GB": "British English",
  FR: "French",
  DE: "German",
  ES: "Spanish",
  IT: "Italian",
  NL: "Dutch",
};

/** English name of a language code, for prompts. Falls back to the code itself. */
export function languageName(code: string): string {
  return NAMES[code] ?? NAMES[code.slice(0, 2)] ?? `the language with code ${code}`;
}
