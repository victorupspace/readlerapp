import { ArrowLeftRight } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useTranslator } from '../hooks/useTranslator'
import { languageHue, languageName, SOURCE_LANGUAGES, studySide, TARGET_LANGUAGES } from '../lib/languages'
import { cx } from '../lib/misc'
import { LanguageSelect } from './LanguageSelect'

/** "Português ⇄ Français" in one pill: two language menus around the swap button. */
export function LanguagePair({ className }: { className?: string }) {
  const translator = useTranslator()
  const { sourceLang, targetLang, result } = translator
  const [turns, setTurns] = useState(0)

  const detected = sourceLang === 'auto' && result ? result.detectedLang : null
  const resolvedSource = sourceLang === 'auto' ? detected : sourceLang
  const studyIsSource = studySide(targetLang) === 'source'
  const sourceDot = studyIsSource && resolvedSource ? languageHue(resolvedSource) : undefined
  const targetDot = studyIsSource ? undefined : languageHue(targetLang)

  return (
    <div
      className={cx(
        'inline-flex h-11 max-w-full items-center gap-1 rounded-full border border-line bg-surface pl-1.5 pr-1.5',
        className,
      )}
    >
      <LanguageSelect
        id="source-lang"
        label="Idioma de origem"
        value={sourceLang}
        options={SOURCE_LANGUAGES}
        onChange={translator.setSourceLang}
        dividerAfter="auto"
        dot={sourceDot}
        quiet={!studyIsSource}
        display={
          detected ? (
            <>
              {languageName(detected)}
              <span className="hidden font-normal text-subtle sm:inline">, detectado</span>
            </>
          ) : undefined
        }
      />
      <button
        type="button"
        aria-label="Inverter idiomas"
        title="Inverter idiomas"
        disabled={!translator.canSwap}
        onClick={() => {
          setTurns((count) => count + 1)
          translator.swap()
        }}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-field text-ink transition-[transform,opacity] duration-150 hover:opacity-80 active:scale-95 disabled:opacity-35"
      >
        <ArrowLeftRight
          size={15}
          strokeWidth={2}
          aria-hidden
          style={{ '--turns': turns } as CSSProperties}
          className="rotate-[calc(var(--turns)*180deg)] transition-transform duration-200 ease-[var(--ease-calm)]"
        />
      </button>
      <LanguageSelect
        id="target-lang"
        label="Idioma de destino"
        value={targetLang}
        options={TARGET_LANGUAGES}
        onChange={translator.setTargetLang}
        dot={targetDot}
        quiet={studyIsSource}
      />
    </div>
  )
}
