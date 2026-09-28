import type { Formality, SourceLang, TargetLang } from './languages'

// Typed client for the three Supabase Edge Functions. API keys for DeepL and
// Anthropic never reach the browser; only the public Supabase key does.

export interface TranslateRequest {
  text: string
  source_lang: Exclude<SourceLang, 'auto'> | null
  target_lang: TargetLang
  formality?: Formality
}

export interface TranslateResponse {
  translation: string
  detected_source_lang: string
}

export interface UsageResponse {
  character_count: number
  character_limit: number
}

export interface ExplainRequest {
  text: string
  translation: string
  /** Chosen or detected source language (may be outside the menu, e.g. "ES"). */
  source_lang: string
  target_lang: TargetLang
}

export interface ExamplesRequest {
  /** A single word in the language being studied. */
  word: string
  /** Its language code, e.g. "FR", "DE", "EN-GB". */
  lang: string
}

export interface ExamplesResponse {
  examples: { target: string; pt: string }[]
  source: 'tatoeba'
}

export interface Explanation {
  kind: 'word' | 'phrase' | 'sentence'
  grammar: string[] | null
  examples: { target: string; pt: string }[]
  context: string | null
}

type FunctionName = 'translate' | 'usage' | 'explain' | 'examples'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// DeepL and Tatoeba answer from Europe, so running these two functions in
// Frankfurt is about half a second faster per call than the region nearest
// the browser. Override with VITE_FUNCTIONS_REGION if that ever changes.
const FUNCTIONS_REGION = import.meta.env.VITE_FUNCTIONS_REGION ?? 'eu-central-1'
const PINNED: readonly FunctionName[] = ['translate', 'examples']

async function call<T>(name: FunctionName, body?: unknown, signal?: AbortSignal): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new ApiError(
      'NOT_CONFIGURED',
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar o Readler.',
      0,
    )
  }

  let res: Response
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...(PINNED.includes(name) ? { 'x-region': FUNCTIONS_REGION } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError(
      'NETWORK',
      navigator.onLine
        ? 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
        : 'Você está offline. Conecte-se à internet para traduzir.',
      0,
    )
  }

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const error = (data as { error?: { code?: string; message?: string } } | null)?.error
    throw new ApiError(error?.code ?? `HTTP_${res.status}`, error?.message ?? fallbackMessage(res.status), res.status)
  }
  return data as T
}

function fallbackMessage(status: number): string {
  if (status === 404) return 'Função não encontrada. Confira se as Edge Functions foram publicadas.'
  if (status === 429) return 'Muitas solicitações em pouco tempo. Aguarde um instante e tente de novo.'
  if (status === 401 || status === 403) return 'Acesso negado pelo servidor.'
  if (status >= 500) return 'O servidor está instável agora. Tente novamente em instantes.'
  return 'Algo deu errado. Tente novamente.'
}

/**
 * Wakes the translate and examples functions so the first real call skips
 * their cold start. Fire and forget.
 */
export function warmUp(): void {
  if (!SUPABASE_URL || !SUPABASE_KEY) return
  for (const name of PINNED) {
    fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'x-region': FUNCTIONS_REGION },
      priority: 'low',
    }).catch(() => {})
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Friendly Portuguese message for anything thrown by the API layer. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.'
}

export const api = {
  translate: (request: TranslateRequest, signal?: AbortSignal) =>
    call<TranslateResponse>('translate', request, signal),
  usage: (signal?: AbortSignal) => call<UsageResponse>('usage', undefined, signal),
  explain: (request: ExplainRequest, signal?: AbortSignal) => call<Explanation>('explain', request, signal),
  explainStatus: (signal?: AbortSignal) => call<{ available: boolean }>('explain', undefined, signal),
  examples: (request: ExamplesRequest, signal?: AbortSignal) => call<ExamplesResponse>('examples', request, signal),
}
