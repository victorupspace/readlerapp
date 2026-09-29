import { useMemo } from 'react'
import { useTranslator } from '../../hooks/useTranslator'
import { bcp47, studySide } from '../../lib/languages'
import { cx } from '../../lib/misc'
import { resolvedSource } from '../../lib/study'
import { alignSentences } from '../../lib/text'
import { InlineError } from '../InlineError'
import { StudyLine } from './StudyLine'

/**
 * The reading view: each sentence of the text with its translation right
 * beneath. The line in the language being studied is the big one, with every
 * word tappable; the Portuguese line sits above it, quieter.
 */
export function Interlinear() {
  const translator = useTranslator()
  const { loading, error, focus } = translator
  const result = error ? null : translator.result
  const pairs = useMemo(() => (result ? alignSentences(result.text, result.translation) : []), [result])

  if (error) return <InlineError message={error} onRetry={translator.translateNow} />
  if (!result) {
    return loading ? (
      <div aria-hidden className="relative h-0.5 overflow-hidden rounded-full bg-line">
        <div className="progress-line" />
      </div>
    ) : null
  }

  const source = resolvedSource(result)
  const studyIsSource = studySide(result.targetLang) === 'source'
  const studyLang = studyIsSource ? source : result.targetLang
  const quietLang = studyIsSource ? result.targetLang : source

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cx(
          'pointer-events-none absolute -top-4 left-0 right-0 h-0.5 overflow-hidden rounded-full transition-opacity duration-150',
          loading ? 'opacity-100 delay-150' : 'opacity-0',
        )}
      >
        {loading && <div className="progress-line" />}
      </div>

      <ol
        key={result.key}
        aria-label="Leitura frase a frase"
        className={cx(
          'flex animate-fade flex-col gap-6 px-1 transition-opacity duration-200 sm:px-2 lg:gap-7',
          loading && 'opacity-50',
        )}
      >
        {pairs.map((pair, index) => {
          const studyText = studyIsSource ? pair.source : pair.translation
          const quietText = studyIsSource ? pair.translation : pair.source
          return (
            <li key={index} className="flex flex-col gap-1.5">
              <p lang={bcp47(quietLang)} className="text-[16px] leading-[1.5] text-muted text-pretty lg:text-[17px]">
                {quietText}
              </p>
              <StudyLine
                text={studyText}
                lang={studyLang}
                langTag={bcp47(studyLang)}
                selectedWord={focus && focus.sentence === index ? focus.word : null}
                onWord={(word) =>
                  translator.focusWord(
                    focus && focus.sentence === index && focus.word === word ? null : { word, lang: studyLang, sentence: index },
                  )
                }
                className="text-[22px] font-medium leading-[1.4] text-ink text-pretty lg:text-[26px]"
              />
            </li>
          )
        })}
      </ol>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Tradução: {result.translation}
      </p>
    </div>
  )
}
