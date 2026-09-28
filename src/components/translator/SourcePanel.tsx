import { X } from 'lucide-react'
import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslator } from '../../hooks/useTranslator'
import { bcp47, languageName, SOURCE_LANGUAGES } from '../../lib/languages'
import { cx } from '../../lib/misc'
import { ActionLink } from '../ActionLink'
import { LanguageSelect } from '../LanguageSelect'
import { SpeakButton } from '../SpeakButton'
import { PageFoot, pageBodyClass, pageTextClass, RunningHead } from './Panel'

export const MAX_CHARS = 5000

export function SourcePanel() {
  const translator = useTranslator()
  const { sourceText, sourceLang, result } = translator
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const detected = sourceLang === 'auto' && result ? result.detectedLang : null
  const spokenLang = sourceLang === 'auto' ? detected : sourceLang

  // Grow with the content instead of scrolling inside the page.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [sourceText])

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      translator.translateNow()
    }
  }

  return (
    <div className="flex min-w-0 flex-col">
      <RunningHead>
        <LanguageSelect
          id="source-lang"
          label="Idioma de origem"
          value={sourceLang}
          options={SOURCE_LANGUAGES}
          onChange={translator.setSourceLang}
          dividerAfter="auto"
          display={
            detected ? (
              <>
                {languageName(detected)} <span className="text-subtle">· detectado</span>
              </>
            ) : undefined
          }
        />
      </RunningHead>

      <div
        className={cx(pageBodyClass, 'cursor-text')}
        onMouseDown={(event) => {
          // Clicking the empty area under the text still places the cursor.
          if (event.target === event.currentTarget) {
            event.preventDefault()
            textareaRef.current?.focus()
          }
        }}
      >
        <label htmlFor="source-text" className="sr-only">
          Texto para traduzir
        </label>
        <textarea
          ref={textareaRef}
          id="source-text"
          value={sourceText}
          onChange={(event) => translator.setSourceText(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={() => setTimeout(translator.translateNow, 0)}
          maxLength={MAX_CHARS}
          rows={1}
          placeholder="Escreva ou cole o texto aqui."
          lang={spokenLang ? bcp47(spokenLang) : undefined}
          spellCheck
          autoComplete="off"
          aria-describedby="source-count"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          className={cx(
            pageTextClass,
            'block min-h-[152px] w-full resize-none overflow-hidden bg-transparent text-pretty outline-none placeholder:text-subtle md:min-h-[240px]',
          )}
        />
      </div>

      <PageFoot>
        <SpeakButton variant="text" id="source" text={sourceText} lang={spokenLang ?? ''} label="Ouvir texto original" />
        <div className="ml-auto flex items-center gap-2">
          <span id="source-count" className="text-[12px] tabular-nums text-subtle">
            {sourceText.length} / {MAX_CHARS}
          </span>
          <ActionLink
            aria-label="Limpar texto"
            title="Limpar texto"
            icon={<X size={14} strokeWidth={2} aria-hidden />}
            disabled={!sourceText}
            className={cx(!sourceText && 'invisible')}
            onClick={() => {
              translator.clear()
              textareaRef.current?.focus()
            }}
          >
            Limpar
          </ActionLink>
        </div>
      </PageFoot>
    </div>
  )
}
