import { ArrowRight, BookmarkPlus, BookOpen, Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useExplain } from '../../hooks/useExplain'
import { useExplainAvailable } from '../../hooks/useExplainAvailable'
import { useTranslator } from '../../hooks/useTranslator'
import { findEntry, toggleExample, useVocabulary, type Example } from '../../hooks/useVocabulary'
import { announce } from '../../lib/announce'
import type { Explanation, ExplainRequest } from '../../lib/api'
import { bcp47, studySide } from '../../lib/languages'
import { cx, prefersReducedMotion } from '../../lib/misc'
import { draftForRequest, explainRequestFor } from '../../lib/study'
import { countWords, isShortText } from '../../lib/text'
import { InlineError } from '../InlineError'
import { SpeakButton } from '../SpeakButton'
import { ExplainSkeleton } from './ExplainSkeleton'

/** Waits for a pause before explaining short texts, so words typed in passing aren't looked up. */
const AUTO_DELAY_MS = 700

export function ExplainSection() {
  const { result: latest, error, wordFocus } = useTranslator()
  // Without ANTHROPIC_API_KEY on the server the section stays hidden: plain translator mode.
  const available = useExplainAvailable()
  const result = error || !available ? null : latest
  const [manualKey, setManualKey] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const mainRequest = result ? explainRequestFor(result) : null
  const short = result ? isShortText(result.text) : false
  const requested = result !== null && manualKey === result.key
  const request = !available ? null : (wordFocus ?? (mainRequest && (short || requested) ? mainRequest : null))
  const explain = useExplain(request, wordFocus || !short ? 0 : AUTO_DELAY_MS)

  useEffect(() => {
    if (!wordFocus) return
    const section = sectionRef.current
    section?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    section?.focus({ preventScroll: true })
  }, [wordFocus])

  if (!result || (!mainRequest && !wordFocus)) return null

  if (!request) {
    // Longer texts: only on demand.
    return (
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => setManualKey(result.key)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-[14px] font-medium text-muted transition-colors duration-150 hover:border-line-strong hover:bg-surface hover:text-ink"
        >
          <BookOpen size={17} strokeWidth={1.75} aria-hidden />
          Gerar exemplo e contexto
        </button>
      </div>
    )
  }

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="explain-title"
      aria-busy={explain.status === 'loading'}
      className="mt-6 scroll-mt-24 rounded-[20px] border border-line bg-surface shadow-card outline-none sm:mt-8"
    >
      <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
        <h2 id="explain-title" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-subtle">
          Exemplo e contexto
        </h2>
        <ExplainHeader request={request} />
        {explain.status === 'loading' && <ExplainSkeleton />}
        {explain.status === 'error' && <InlineError className="mt-6" message={explain.error} onRetry={explain.retry} />}
        {explain.status === 'success' && <ExplainBody request={request} data={explain.data} />}
      </div>
    </section>
  )
}

function ExplainHeader({ request }: { request: ExplainRequest }) {
  const studyIsSource = studySide(request.target_lang) === 'source'
  const studyText = studyIsSource ? request.text : request.translation
  const studyLang = studyIsSource ? request.source_lang : request.target_lang
  // Words and short phrases read as "a → b" on one line; longer texts stack.
  const compact = [request.text, request.translation].every((side) => side.length <= 32 && countWords(side) <= 4)

  const source = (
    <span lang={bcp47(request.source_lang)} className={cx(!studyIsSource && 'text-muted')}>
      {request.text}
    </span>
  )
  const translation = (
    <span lang={bcp47(request.target_lang)} className={cx(studyIsSource && 'text-muted')}>
      {request.translation}
    </span>
  )

  return (
    <div className="mt-3 flex items-start gap-3">
      {compact ? (
        <p className="min-w-0 flex-1 font-serif text-[1.75rem] leading-[1.3] text-ink sm:text-[2rem]">
          {source}
          <ArrowRight
            aria-hidden
            size={22}
            strokeWidth={1.5}
            className="mx-2.5 inline-block -translate-y-[3px] text-subtle sm:mx-3"
          />
          <span className="sr-only">, tradução: </span>
          {translation}
        </p>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[15px] leading-relaxed text-muted">{source}</p>
          <p className="mt-1 line-clamp-3 font-serif text-[1.3125rem] leading-snug text-ink">{translation}</p>
        </div>
      )}
      <SpeakButton
        id="explain-expression"
        text={studyText}
        lang={studyLang}
        label="Ouvir expressão"
        className="-mr-2.5 -mt-0.5 sm:-mr-3"
      />
    </div>
  )
}

function ExplainBody({ request, data }: { request: ExplainRequest; data: Explanation }) {
  const draft = draftForRequest(request)
  const entry = findEntry(useVocabulary(), draft.term, draft.termLang)
  const studyLang = draft.termLang

  const toggle = (example: Example) => {
    announce(toggleExample(draft, example) ? 'Exemplo salvo no vocabulário' : 'Exemplo removido do vocabulário')
  }

  return (
    <div className="animate-fade-in">
      {data.grammar && (
        <ul aria-label="Gramática" className="mt-5 flex flex-wrap gap-2">
          {data.grammar.map((label) => (
            <li key={label} className="rounded-full border border-line bg-page/70 px-3 py-1 text-[13px] leading-5 text-muted">
              {label}
            </li>
          ))}
        </ul>
      )}

      <ol aria-label="Exemplos" className="mt-6 divide-y divide-line border-t border-line">
        {data.examples.map((example, index) => {
          const saved = entry?.example?.target === example.target
          return (
            <li key={index} className="flex flex-col gap-1.5 py-5 sm:flex-row sm:items-start sm:gap-8 sm:py-6">
              <div className="min-w-0 flex-1">
                <p lang={bcp47(studyLang)} className="font-serif text-[1.1875rem] leading-[1.5] text-ink sm:text-[1.3125rem]">
                  {example.target}
                </p>
                <p lang="pt-BR" className="mt-1 text-[15px] leading-relaxed text-muted">
                  {example.pt}
                </p>
              </div>
              <div className="-ml-3 flex shrink-0 items-center gap-0.5 sm:-mr-3 sm:ml-0">
                <SpeakButton
                  id={`example-${index}`}
                  text={example.target}
                  lang={studyLang}
                  label={`Ouvir exemplo ${index + 1}`}
                />
                <button
                  type="button"
                  aria-label={`${saved ? 'salvo' : 'salvar'} exemplo ${index + 1}`}
                  onClick={() => toggle(example)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-accent transition-colors duration-150 hover:bg-accent/10"
                >
                  {saved ? (
                    <Check size={16} strokeWidth={2} aria-hidden />
                  ) : (
                    <BookmarkPlus size={16} strokeWidth={1.75} aria-hidden />
                  )}
                  {saved ? 'salvo' : 'salvar'}
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      {data.context && (
        <p className="mt-1 border-l-2 border-accent/35 pl-4 text-[15px] leading-relaxed text-muted sm:text-base">
          {data.context}
        </p>
      )}
    </div>
  )
}
