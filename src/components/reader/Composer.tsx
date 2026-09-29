import { X } from 'lucide-react'
import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslator } from '../../hooks/useTranslator'
import { bcp47 } from '../../lib/languages'
import { Button } from '../Button'
import { SpeakButton } from '../SpeakButton'

export const MAX_CHARS = 5000

/** Where the text is written or pasted; the reading lines render below it. */
export function Composer() {
  const translator = useTranslator()
  const { sourceText, sourceLang, result } = translator
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const detected = sourceLang === 'auto' && result ? result.detectedLang : null
  const spokenLang = sourceLang === 'auto' ? detected : sourceLang

  // Grow with the content instead of scrolling inside the card.
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
    <div
      className="flex flex-col gap-2.5 rounded-2xl border border-line bg-surface px-5 pb-3 pt-4 shadow-card transition-[border-color] duration-200 focus-within:border-line-strong sm:px-6"
      onMouseDown={(event) => {
        // Clicking the empty area of the card still places the cursor.
        if (event.target === event.currentTarget) {
          event.preventDefault()
          textareaRef.current?.focus()
        }
      }}
    >
      <label htmlFor="source-text" className="text-[13px] text-subtle">
        Escreva ou cole um texto
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
        placeholder="Por exemplo: a ponte que liga os dois bairros da cidade."
        lang={spokenLang ? bcp47(spokenLang) : undefined}
        spellCheck
        autoComplete="off"
        aria-describedby="source-count"
        aria-keyshortcuts="Control+Enter Meta+Enter"
        className="block min-h-[76px] w-full resize-none overflow-hidden bg-transparent text-[17px] leading-[1.5] text-ink text-pretty outline-none placeholder:text-subtle"
      />
      <div className="flex items-center gap-2">
        <SpeakButton size="sm" id="source" text={sourceText} lang={spokenLang ?? ''} label="Ouvir texto original">
          Ouvir original
        </SpeakButton>
        <Button
          size="sm"
          icon={<X size={14} strokeWidth={2.2} aria-hidden />}
          disabled={!sourceText}
          className={sourceText ? undefined : 'invisible'}
          aria-label="Limpar texto"
          onClick={() => {
            translator.clear()
            textareaRef.current?.focus()
          }}
        >
          Limpar
        </Button>
        <span id="source-count" className="ml-auto whitespace-nowrap text-[13px] tabular-nums text-subtle">
          {sourceText.length} de {MAX_CHARS}
        </span>
      </div>
    </div>
  )
}
