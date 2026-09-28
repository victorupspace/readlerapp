import { useSyncExternalStore } from 'react'
import { bcp47 } from '../lib/languages'

// Text-to-speech with the browser's Web Speech API. One utterance plays at a
// time across the app; each listen button has an id so it can show a stop state.

export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

export const NORMAL_RATE = 1
export const SLOW_RATE = 0.7

let speakingId: string | null = null
const listeners = new Set<() => void>()
let voices: SpeechSynthesisVoice[] = []

function setSpeaking(id: string | null) {
  speakingId = id
  listeners.forEach((listener) => listener())
}

if (speechSupported) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices()
  }
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

/** Best installed voice for a BCP 47 tag, preferring exact region and higher-quality voices. */
function pickVoice(tag: string): SpeechSynthesisVoice | undefined {
  const normalized = (lang: string) => lang.replace('_', '-').toLowerCase()
  const exact = voices.filter((voice) => normalized(voice.lang) === tag.toLowerCase())
  const pool = exact.length > 0 ? exact : voices.filter((voice) => normalized(voice.lang).startsWith(tag.slice(0, 2)))
  const score = (voice: SpeechSynthesisVoice) =>
    (/natural|premium|enhanced|neural|google/i.test(voice.name) ? 2 : 0) + (voice.default ? 1 : 0)
  return [...pool].sort((a, b) => score(b) - score(a))[0]
}

/** Splits long text at sentence boundaries; Chrome stops utterances that run past ~15 s. */
function chunk(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?…\n]+[.!?…]*\s*|\n+/g) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && (current + sentence).length > max) {
      chunks.push(current)
      current = ''
    }
    if (sentence.length > max) {
      for (const piece of sentence.match(new RegExp(`.{1,${max}}(\\s|$)`, 'g')) ?? [sentence]) chunks.push(piece)
    } else {
      current += sentence
    }
  }
  if (current) chunks.push(current)
  return chunks.map((piece) => piece.trim()).filter(Boolean)
}

export function stopSpeaking(): void {
  if (!speechSupported) return
  window.speechSynthesis.cancel()
  setSpeaking(null)
}

/** Speaks `text` in `lang` (any Readler code). Calling it again with the same id stops it. */
export function speak(id: string, text: string, lang: string, rate = NORMAL_RATE): void {
  if (!speechSupported || !text.trim()) return
  const synth = window.speechSynthesis
  const wasSpeaking = speakingId === id
  synth.cancel()
  if (wasSpeaking) {
    setSpeaking(null)
    return
  }

  const tag = bcp47(lang)
  const voice = pickVoice(tag)
  const parts = chunk(text)
  setSpeaking(id)
  parts.forEach((part, index) => {
    const utterance = new SpeechSynthesisUtterance(part)
    utterance.lang = tag
    if (voice) utterance.voice = voice
    utterance.rate = rate
    utterance.onerror = () => {
      if (speakingId === id) setSpeaking(null)
    }
    if (index === parts.length - 1) {
      utterance.onend = () => {
        if (speakingId === id) setSpeaking(null)
      }
    }
    synth.speak(utterance)
  })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSpeech() {
  const current = useSyncExternalStore(
    subscribe,
    () => speakingId,
    () => null,
  )
  return { supported: speechSupported, speakingId: current, speak, stop: stopSpeaking }
}
