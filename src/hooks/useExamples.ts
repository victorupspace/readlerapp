import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage, isAbortError, type ExamplesRequest, type Explanation } from '../lib/api'
import { readExplanation, writeExplanation } from '../lib/explain-cache'
import { hash } from '../lib/misc'
import type { ExplainState } from './useExplain'

// Example sentences for a single word from Tatoeba, shaped like a Verbete so
// the same section renders them. Results are cached in localStorage next to
// the Verbetes, and requests in flight are shared, so a lookup started ahead
// of the translation is picked up by the section instead of repeated.

const inFlight = new Map<string, Promise<Explanation>>()

export function examplesKey(request: ExamplesRequest): string {
  return hash(['tatoeba', request.lang.slice(0, 2).toUpperCase(), request.word.toLowerCase()].join('\u0000'))
}

function load(key: string, request: ExamplesRequest): Promise<Explanation> {
  let promise = inFlight.get(key)
  if (!promise) {
    promise = api
      .examples(request)
      .then((response) => {
        const data: Explanation = { kind: 'word', grammar: null, examples: response.examples, context: null }
        writeExplanation(key, data)
        return data
      })
      .finally(() => inFlight.delete(key))
    inFlight.set(key, promise)
  }
  return promise
}

export function useExamples(request: ExamplesRequest | null, delay = 0): ExplainState & { retry: () => void } {
  const key = request ? examplesKey(request) : null
  const cached = key ? readExplanation(key) : null
  const [state, setState] = useState<{ key: string; data?: Explanation; error?: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  const word = request?.word
  const lang = request?.lang

  useEffect(() => {
    if (!key || cached || !word || !lang) return
    let active = true
    const timer = setTimeout(() => {
      load(key, { word, lang })
        .then((data) => {
          if (active) setState({ key, data })
        })
        .catch((error: unknown) => {
          if (active && !isAbortError(error)) setState({ key, error: errorMessage(error) })
        })
    }, delay)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [key, cached, attempt, delay, word, lang])

  const retry = useCallback(() => {
    setState(null)
    setAttempt((count) => count + 1)
  }, [])

  if (!key) return { status: 'idle', retry }
  if (cached) return { status: 'success', data: cached, retry }
  if (state?.key === key) {
    if (state.data) return { status: 'success', data: state.data, retry }
    if (state.error) return { status: 'error', error: state.error, retry }
  }
  return { status: 'loading', retry }
}
