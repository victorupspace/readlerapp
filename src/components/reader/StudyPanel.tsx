import { Bookmark, BookmarkPlus, BookOpen, Check } from 'lucide-react'
import type { StudySubject } from '../../hooks/useStudySubject'
import { findEntry, toggleEntry, toggleExample, useVocabulary, type Example } from '../../hooks/useVocabulary'
import { announce } from '../../lib/announce'
import { bcp47 } from '../../lib/languages'
import { cx } from '../../lib/misc'
import { Button } from '../Button'
import { InlineError } from '../InlineError'
import { SpeakButton } from '../SpeakButton'

interface StudyPanelProps {
  subject: StudySubject
  /** Bigger headword on wide screens. */
  size?: 'rail' | 'sheet'
}

/**
 * The study margin's content: the word or expression being studied, its
 * gloss, grammar, examples with Portuguese, and a note. Rendered in the rail
 * on desktop and in the sheet on phones.
 */
export function StudyPanel({ subject, size = 'rail' }: StudyPanelProps) {
  const vocabulary = useVocabulary()

  if (subject.kind === 'none') {
    return (
      <div className="flex flex-col gap-2 py-6 text-center">
        <BookOpen size={22} strokeWidth={1.6} aria-hidden className="mx-auto text-subtle" />
        <p className="text-[15px] font-medium text-ink">A margem de estudo</p>
        <p className="mx-auto max-w-[26ch] text-[14px] leading-relaxed text-muted">
          {subject.canGenerate
            ? 'Toque numa palavra da leitura, ou peça o verbete do texto inteiro.'
            : 'Escreva um texto e toque numa palavra da leitura para ver o que ela significa e como se usa.'}
        </p>
        {subject.canGenerate && (
          <Button onClick={subject.generate} icon={<BookOpen size={16} strokeWidth={1.8} aria-hidden />} className="mx-auto mt-2">
            Gerar verbete
          </Button>
        )}
      </div>
    )
  }

  const { draft } = subject
  const saved = draft ? findEntry(vocabulary, draft.term, draft.termLang) : undefined
  const data = subject.entry.status === 'success' ? subject.entry.data : null

  const toggleSave = () => {
    if (!draft) return
    announce(toggleEntry(draft) ? 'Salvo no vocabulário' : 'Removido do vocabulário')
  }

  const toggleExampleSave = (example: Example) => {
    if (!draft) return
    announce(toggleExample(draft, example) ? 'Exemplo salvo no vocabulário' : 'Exemplo removido do vocabulário')
  }

  const showExamples = subject.entry.status !== 'idle' && !(data && data.examples.length === 0)

  return (
    <div key={`${subject.headLang}:${subject.head}`} className="flex animate-fade flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
          <h2
            lang={bcp47(subject.headLang)}
            className={cx(
              'min-w-0 font-semibold leading-[1.05] tracking-[-0.02em] text-ink text-pretty',
              size === 'rail' ? 'text-[32px] lg:text-[40px]' : 'text-[32px]',
              subject.head.length > 40 && 'text-[24px] lg:text-[26px]',
            )}
          >
            {subject.head}
          </h2>
          {subject.glossStatus === 'loading' && (
            <span aria-hidden className="inline-block h-4 w-24 animate-pulse-soft rounded-full bg-ink/10" />
          )}
          {subject.gloss && (
            <span lang={bcp47(subject.glossLang)} className="text-[19px] leading-snug text-muted text-pretty">
              {subject.gloss}
            </span>
          )}
        </div>
        {subject.glossStatus === 'error' && (
          <p className="text-[14px] text-danger">Não foi possível traduzir a palavra agora.</p>
        )}
        {data?.grammar && (
          <p className="text-[14px] leading-relaxed text-muted">{data.grammar.join(', ')}.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={!draft}
          active={Boolean(saved)}
          onClick={toggleSave}
          icon={
            saved ? (
              <Check size={16} strokeWidth={2.2} aria-hidden />
            ) : (
              <Bookmark size={16} strokeWidth={1.8} aria-hidden />
            )
          }
        >
          {saved ? 'Salva no vocabulário' : subject.kind === 'word' ? 'Salvar palavra' : 'Salvar'}
        </Button>
        <SpeakButton id="study-head" text={subject.head} lang={subject.headLang} label="Ouvir" />
      </div>

      {showExamples && (
        <div className="flex flex-col gap-3.5 border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-subtle">Exemplos</p>
          {subject.entry.status === 'loading' && <ExamplesSkeleton />}
          {subject.entry.status === 'error' && <InlineError message={subject.entry.error} onRetry={subject.entry.retry} />}
          {data &&
            data.examples.map((example, index) => {
              const exampleSaved = saved?.example?.target === example.target
              return (
                <div key={index} className="flex flex-col gap-1">
                  <p lang={bcp47(subject.headLang)} className="text-[17px] font-medium leading-[1.45] text-ink text-pretty">
                    {example.target}
                  </p>
                  <p lang="pt-BR" className="text-[14px] leading-relaxed text-muted text-pretty">
                    {example.pt}
                  </p>
                  <div className="-ml-2 flex items-center">
                    <SpeakButton
                      variant="text"
                      size="sm"
                      id={`example-${index}`}
                      text={example.target}
                      lang={subject.headLang}
                      label={`Ouvir exemplo ${index + 1}`}
                    />
                    <Button
                      variant="text"
                      size="sm"
                      active={exampleSaved}
                      disabled={!draft}
                      aria-label={`${exampleSaved ? 'Exemplo salvo' : 'Salvar exemplo'} ${index + 1}`}
                      onClick={() => toggleExampleSave(example)}
                      icon={
                        exampleSaved ? (
                          <Check size={14} strokeWidth={2.2} aria-hidden />
                        ) : (
                          <BookmarkPlus size={14} strokeWidth={1.8} aria-hidden />
                        )
                      }
                    >
                      {exampleSaved ? 'Salvo' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {data?.context && (
        <div className="flex flex-col gap-2 border-t border-line pt-5">
          <p className="text-[13px] font-semibold text-subtle">Nota</p>
          <p className="text-[15px] leading-[1.55] text-ink text-pretty">{data.context}</p>
        </div>
      )}

      {data && subject.source === 'tatoeba' && data.examples.length > 0 && (
        <p className="text-[12px] text-subtle">
          Frases de{' '}
          <a href="https://tatoeba.org" target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:text-ink">
            Tatoeba
          </a>
          , licença CC BY.
        </p>
      )}
    </div>
  )
}

function ExamplesSkeleton() {
  return (
    <div aria-hidden className="flex animate-pulse-soft flex-col gap-5">
      {[0, 1].map((row) => (
        <div key={row} className="flex flex-col gap-2.5">
          <div className="h-4 w-[82%] rounded bg-ink/8" />
          <div className="h-3.5 w-[58%] rounded bg-ink/6" />
        </div>
      ))}
    </div>
  )
}
