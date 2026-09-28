/** Collapses runs of whitespace and trims. */
export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** The word/phrase study case: up to ~80 characters and 10 words. */
export function isShortText(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length <= 80 && countWords(trimmed) <= 10
}

/** Lowercase without diacritics, so "ecole" finds "école" and "strasse" finds "Straße". */
export function foldForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').toLowerCase()
}

export function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length)
  let i = 0
  while (i < max && a[i] === b[i]) i++
  return i
}

export interface Token {
  text: string
  /** True for tappable words (not spaces, punctuation or bare numbers). */
  word: boolean
}

// Letters and digits, keeping inner apostrophes and hyphens together:
// "l'homme", "aujourd'hui", "peut-être", "don't".
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu

export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  for (const match of text.matchAll(WORD)) {
    const start = match.index
    if (start > last) tokens.push({ text: text.slice(last, start), word: false })
    tokens.push({ text: match[0], word: !/^\p{N}+$/u.test(match[0]) })
    last = start + match[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last), word: false })
  return tokens
}
