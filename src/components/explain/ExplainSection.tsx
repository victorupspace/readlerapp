import { BookmarkPlus, BookOpen, Check } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useExamples } from '../../hooks/useExamples'
import { useExplain } from '../../hooks/useExplain'
import { useExplainAvailable } from '../../hooks/useExplainAvailable'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useTranslator } from '../../hooks/useTranslator'
import { findEntry, toggleExample, useVocabulary, type Example } from '../../hooks/useVocabulary'
import { announce } from '../../lib/announce'
import type { Explanation, ExplainRequest } from '../../lib/api'
import { bcp47, isStudyLang, studySide } from '../../lib/languages'
import { cx, prefersReducedMotion } from '../../lib/misc'
import { draftForRequest, explainRequestFor, resolvedSource } from '../../lib/study'
import { countWords, isShortText, singleWord } from '../../lib/text'
import { ActionLink } from '../ActionLink'
import { InlineError } from '../InlineError'
import { SpeakButton } from '../SpeakButton'
import { ExplainSkeleton } from './ExplainSkeleton'

/** Waits for a pause before asking Claude about short texts, so words typed in passing aren't billed. */
const AUTO_DELAY_MS = 700
/** Tatoeba lookups are free: a typed word is looked up after the same pause that triggers its translation. */
const PREFETCH_DELAY_MS = 300

/** The expression in the language being studied, and the other side as its gloss. */
function headwordOf(request: ExplainRequest) {
  const studyIsSource = studySide(request.target_lang) === 'source'
  return {
    text: studyIsSource ? request.text : request.translation,
    lang: studyIsSource ? request.source_lang : request.target_lang,
    gloss: studyIsSource ? request.translation : request.text,
    glossLang: studyIsSource ? request.target_lang : request.source_lang,
  }
}

const sectionClass = 'mt-10 scroll-mt-24 border-t border-line pt-5 outline-none sm:mt-12 sm:pt-6'

/**
 * "Verbete": the dictionary entry under the edition. On wide screens the labels
 * (Verbete, Exemplos, Nota) sit in a margin column, the content beside them.
 * Without the Verbete configured, single words still get example sentences
 * from Tatoeba.
 */
export function ExplainSection() {
  const { result: latest, error, wordFocus, sourceText, sourceLang } = useTranslator()
  const available = useExplainAvailable()
  const result = error ? null : latest
  const [manualKey, setManualKey] = useState<string | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const mainRequest = result ? explainRequestFor(result) : null
  const short = result ? isShortText(result.text) : false
  const requested = result !== null && manualKey === result.key
  const request = !available ? null : (wordFocus ?? (mainRequest && (short || requested) ? mainRequest : null))
  const explain = useExplain(request, wordFocus || !short ? 0 : AUTO_DELAY_MS)

  // Fallback for single words when Claude is not configured: examples are
  // fetched the moment the translation lands and, when the typed word is
  // already in a study language, ahead of it, in parallel with the translation.
  const head = mainRequest ? headwordOf(mainRequest) : null
  const word = !available && head ? singleWord(head.text) : null
  const examples = useExamples(word && head ? { word, lang: head.lang } : null)
  const typedWord = !available ? singleWord(sourceText) : null
  const guessedLang = sourceLang !== 'auto' ? sourceLang : latest ? resolvedSource(latest) : null
  useExamples(typedWord && guessedLang && isStudyLang(guessedLang) ? { word: typedWord, lang: guessedLang } : null, PREFETCH_DELAY_MS)

  useEffect(() => {
    if (!wordFocus) return
    const section = sectionRef.current
    section?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    section?.focus({ preventScroll: true })
  }, [wordFocus])

  if (!result || !mainRequest) return null

  if (!available) {
    if (!word || (examples.status === 'success' && examples.data.examples.length === 0)) return null
    return (
      <section aria-labelledby="examples-title" aria-busy={examples.status === 'loading'} className={sectionClass}>
        <EntryRow
          label={
            <h2 id="examples-title" className="label-caps text-subtle sm:pt-3">
              Exemplos
            </h2>
          }
        >
          <Headword key={`${mainRequest.source_lang}:${mainRequest.text}`} request={mainRequest} />
        </EntryRow>
        {examples.status === 'loading' && <ExplainSkeleton examplesOnly />}
        {examples.status === 'error' && <InlineError className="mt-6" message={examples.error} onRetry={examples.retry} />}
        {examples.status === 'success' && (
          <EntryRow className="mt-5 animate-fade-in" label={<span className="sr-only">Frases</span>}>
            <ExampleList request={mainRequest} examples={examples.data.examples} />
            <p className="mt-3 text-[12px] text-subtle">
              Frases de{' '}
              <a
                href="https://tatoeba.org"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                Tatoeba
              </a>
              , CC BY 2.0 FR.
            </p>
          </EntryRow>
        )}
      </section>
    )
  }

  if (!wordFocus && !request) {
    // Longer texts: only on demand.
    return (
      <div className="mt-8 flex justify-center border-t border-line pt-2 sm:mt-10">
        <ActionLink onClick={() => setManualKey(result.key)} icon={<BookOpen size={15} strokeWidth={1.75} aria-hidden />}>
          Gerar verbete
        </ActionLink>
      </div>
    )
  }

  if (!request) return null

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="explain-title"
      aria-busy={explain.status === 'loading'}
      className={sectionClass}
    >
      <EntryRow
        label={
          <h2 id="explain-title" className="label-caps text-subtle sm:pt-3">
            Verbete
          </h2>
        }
      >
        <Headword key={`${request.source_lang}:${request.text}:${request.translation}`} request={request} />
      </EntryRow>
      {explain.status === 'loading' && <ExplainSkeleton />}
      {explain.status === 'error' && <InlineError className="mt-6" message={explain.error} onRetry={explain.retry} />}
      {explain.status === 'success' && <EntryBody request={request} data={explain.data} />}
    </section>
  )
}

function EntryRow({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={cx('sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4', className)}>
      <div>{label}</div>
      <div className="mt-2 min-w-0 sm:mt-0">{children}</div>
    </div>
  )
}

function Headword({ request }: { request: ExplainRequest }) {
  const head = headwordOf(request)

  // Short pairs read as "pont — ponte" on one line; longer ones stack. Phones get a stricter cut.
  const wide = useMediaQuery('(min-width: 640px)')
  const sides = [head.text, head.gloss]
  const compact = wide
    ? head.text.length + head.gloss.length <= 64 && sides.every((side) => countWords(side) <= 8)
    : sides.every((side) => side.length <= 32 && countWords(side) <= 4)

  return (
    <div className="flex animate-fade items-start gap-4">
      <div className="min-w-0 flex-1">
        {compact ? (
          <p className="text-balance font-display text-[1.625rem] leading-[1.25] tracking-[-0.01em] text-ink sm:text-[2rem]">
            <span lang={bcp47(head.lang)} className="font-semibold">
              {head.text}
            </span>
            <span aria-hidden className="mx-3 text-subtle">
              —
            </span>
            <span className="sr-only">, tradução: </span>
            <span lang={bcp47(head.glossLang)} className="text-muted">
              {head.gloss}
            </span>
          </p>
        ) : (
          <>
            <p
              lang={bcp47(head.lang)}
              className="text-pretty font-display text-[1.25rem] font-semibold leading-[1.35] text-ink sm:text-[1.375rem]"
            >
              {head.text}
            </p>
            <p lang={bcp47(head.glossLang)} className="mt-1.5 text-pretty text-[15px] leading-relaxed text-muted">
              {head.gloss}
            </p>
          </>
        )}
      </div>
      <SpeakButton
        variant="text"
        id="explain-expression"
        text={head.text}
        lang={head.lang}
        label="Ouvir expressão"
        className="-mr-2 mt-0.5"
      />
    </div>
  )
}

/** Numbered example sentences with their Portuguese translations, listen and save. */
function ExampleList({ request, examples }: { request: ExplainRequest; examples: Example[] }) {
  const draft = draftForRequest(request)
  const entry = findEntry(useVocabulary(), draft.term, draft.termLang)
  const studyLang = draft.termLang

  const toggle = (example: Example) => {
    announce(toggleExample(draft, example) ? 'Exemplo salvo no vocabulário' : 'Exemplo removido do vocabulário')
  }

  return (
    <ol>
      {examples.map((example, index) => {
        const saved = entry?.example?.target === example.target
        return (
          <li
            key={index}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 py-4 first:pt-0 [&+li]:border-t [&+li]:border-line sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:gap-x-3"
          >
            <span aria-hidden className="pt-[3px] font-display text-[15px] font-medium tabular-nums text-subtle">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p
                lang={bcp47(studyLang)}
                className="text-pretty font-display text-[1.125rem] font-medium leading-[1.45] text-ink sm:text-[1.25rem]"
              >
                {example.target}
              </p>
              <p lang="pt-BR" className="mt-1 text-pretty text-[15px] leading-relaxed text-muted">
                {example.pt}
              </p>
            </div>
            <div className="col-start-2 -ml-2 flex items-center sm:col-start-3 sm:-mr-2 sm:ml-0 sm:-mt-2">
              <SpeakButton
                variant="text"
                id={`example-${index}`}
                text={example.target}
                lang={studyLang}
                label={`Ouvir exemplo ${index + 1}`}
              />
              <ActionLink
                aria-label={`${saved ? 'Salvo' : 'Salvar'} exemplo ${index + 1}`}
                active={saved}
                onClick={() => toggle(example)}
                icon={
                  saved ? (
                    <Check size={14} strokeWidth={2} aria-hidden />
                  ) : (
                    <BookmarkPlus size={14} strokeWidth={1.75} aria-hidden />
                  )
                }
              >
                {saved ? 'Salvo' : 'Salvar'}
              </ActionLink>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function EntryBody({ request, data }: { request: ExplainRequest; data: Explanation }) {
  return (
    <div className="animate-fade-in">
      {data.grammar && (
        <EntryRow label={<span className="sr-only">Gramática</span>}>
          <p className="mt-1 text-[15px] leading-relaxed text-muted sm:mt-2">{data.grammar.join(' · ')}</p>
        </EntryRow>
      )}

      <EntryRow
        className="mt-8 border-t border-line pt-5"
        label={
          <h3 id="explain-examples" className="label-caps text-subtle sm:pt-[7px]">
            Exemplos
          </h3>
        }
      >
        <ExampleList request={request} examples={data.examples} />
      </EntryRow>

      {data.context && (
        <EntryRow
          className="mt-6 border-t border-line pt-5"
          label={<h3 className="label-caps text-subtle sm:pt-[7px]">Nota</h3>}
        >
          <p className="text-pretty text-[15px] leading-relaxed text-muted sm:text-base">{data.context}</p>
        </EntryRow>
      )}
    </div>
  )
}
