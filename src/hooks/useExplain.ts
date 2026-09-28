import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage, isAbortError, type Explanation, type ExplainRequest } from '../lib/api'
import { explainKey, readExplanation, writeExplanation } from '../lib/explain-cache'

export type ExplainState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Explanation }
  | { status: 'error'; error: string }

/**
 * "Exemplo e contexto" for a request, served from the localStorage cache when
 * possible. `delay` postpones the call so words typed in passing don't trigger it.
 */
export function useExplain(request: ExplainRequest | null, delay = 0): ExplainState & { retry: () => void } {
  const key = request ? explainKey(request) : null
  const cached = key ? readExplanation(key) : null
  const [state, setState] = useState<{ key: string; data?: Explanation; error?: string } | null>(null)
  const [attempt, setAttempt] = useState(0)

  const text = request?.text
  const translation = request?.translation
  const sourceLang = request?.source_lang
  const targetLang = request?.target_lang

  useEffect(() => {
    if (!key || cached || text === undefined || translation === undefined || !sourceLang || !targetLang) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api
        .explain({ text, translation, source_lang: sourceLang, target_lang: targetLang }, controller.signal)
        .then((data) => {
          writeExplanation(key, data)
          setState({ key, data })
        })
        .catch((error: unknown) => {
          if (!isAbortError(error)) setState({ key, error: errorMessage(error) })
        })
    }, delay)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, cached, attempt, delay, text, translation, sourceLang, targetLang])

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
