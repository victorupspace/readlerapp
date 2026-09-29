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

/** Letter a glossary entry is filed under: "École" → "E", "ß…" → "S", digits and symbols → "#". */
export function glossaryLetter(term: string): string {
  const match = foldForSearch(term).match(/\p{L}/u)
  return match ? match[0].toUpperCase() : '#'
}

// A leading article doesn't stop "le pont" or "die Brücke" from counting as one word.
const LEADING_ARTICLE =
  /^(?:(?:le|la|les|un|une|des|der|die|das|den|dem|ein|eine|einen|einem|the|an?|o|os|as|um|uma)\s+|l['’])/iu

/** The word itself when the text is a single word (optionally with an article), else null. */
export function singleWord(text: string): string | null {
  const word = normalizeSpaces(text).replace(LEADING_ARTICLE, '').replace(/[.!?…,;:]+$/u, '')
  return /^[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*$/u.test(word) ? word : null
}

// Sentence ends: terminal punctuation (optionally followed by a closing quote or
// bracket), then whitespace, then a capital letter, digit or opening quote.
// A short capitalised abbreviation before the full stop (Sr., Dr., Mme.) doesn't count.
const SENTENCE_END = /(?<!\b\p{Lu}\p{Ll}{0,2}\.)(?<=[.!?…][»”’")\]]?)\s+(?=["«“‘([]?[\p{Lu}\p{N}])/u

/** Sentences of one paragraph, trimmed. */
export function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(SENTENCE_END)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export interface SentencePair {
  source: string
  translation: string
}

/**
 * Pairs a text with its translation sentence by sentence, paragraph by
 * paragraph. Where the two sides don't split the same way, the whole
 * paragraph (or text) becomes one pair, so nothing is ever misaligned.
 */
export function alignSentences(source: string, translation: string): SentencePair[] {
  const paragraphs = (text: string) =>
    text
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  const sourceParagraphs = paragraphs(source)
  const translationParagraphs = paragraphs(translation)
  if (sourceParagraphs.length !== translationParagraphs.length) {
    return [{ source: normalizeSpaces(source), translation: normalizeSpaces(translation) }]
  }
  return sourceParagraphs.flatMap((paragraph, index) => {
    const a = splitSentences(paragraph)
    const b = splitSentences(translationParagraphs[index])
    if (a.length !== b.length) return [{ source: paragraph, translation: translationParagraphs[index] }]
    return a.map((sentence, position) => ({ source: sentence, translation: b[position] }))
  })
}
