import { ArrowRight, Bookmark, BookOpen } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useExplainAvailable } from '../../hooks/useExplainAvailable'
import { useWordTranslation } from '../../hooks/useTranslation'
import { findEntry, toggleEntry, useVocabulary } from '../../hooks/useVocabulary'
import { announce } from '../../lib/announce'
import { bcp47, toSourceLang, type TargetLang } from '../../lib/languages'
import type { ExplainRequest } from '../../lib/api'
import { cx } from '../../lib/misc'
import { studyDraft } from '../../lib/study'

interface WordPopoverProps {
  word: string
  /** Language of the translated text the word comes from. */
  wordLang: TargetLang
  /** Language to translate the word into: Portuguese, or the source language when the text is Portuguese. */
  lookupLang: TargetLang
  anchor: HTMLElement
  onClose: (restoreFocus: boolean) => void
  onExplain: (request: ExplainRequest) => void
}

const MARGIN = 12

export function WordPopover({ word, wordLang, lookupLang, anchor, onClose, onExplain }: WordPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const lookup = useWordTranslation(word, wordLang, lookupLang)
  const vocabulary = useVocabulary()
  const explainAvailable = useExplainAvailable()

  const translation = lookup.status === 'success' ? lookup.translation : null
  const draft = translation ? studyDraft(word, wordLang, translation, lookupLang) : null
  const saved = draft ? Boolean(findEntry(vocabulary, draft.term, draft.termLang)) : false

  // Below the word when it fits, above otherwise; always inside the viewport
  // and clear of the bottom tab bar on phones. Closes once the word scrolls away.
  useLayoutEffect(() => {
    const place = () => {
      const popover = ref.current
      if (!popover) return
      const rect = anchor.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        onClose(false)
        return
      }
      const width = popover.offsetWidth
      const height = popover.offsetHeight
      const viewportWidth = document.documentElement.clientWidth
      const bottomBar = window.matchMedia('(max-width: 639px)').matches ? 80 : 0
      let top = rect.bottom + 8
      if (top + height > window.innerHeight - bottomBar - MARGIN && rect.top - 8 - height > MARGIN) {
        top = rect.top - 8 - height
      }
      const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, MARGIN), viewportWidth - width - MARGIN)
      setPosition({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor, lookup.status, onClose])

  // Move focus in once placed (a hidden element can't take focus).
  const placed = position !== null
  useEffect(() => {
    if (placed) ref.current?.focus({ preventScroll: true })
  }, [placed])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !anchor.contains(target)) onClose(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [anchor, onClose])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose(true)
    }
  }

  const toggleSave = () => {
    if (!draft) return
    announce(toggleEntry(draft) ? 'Salvo no vocabulário' : 'Removido do vocabulário')
  }

  const explain = () => {
    if (!translation) return
    onExplain({
      text: word,
      translation,
      source_lang: toSourceLang(wordLang) ?? wordLang,
      target_lang: lookupLang,
    })
  }

  const rowClass =
    'flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] text-ink transition-colors duration-150 hover:bg-ink/[0.05] disabled:pointer-events-none disabled:opacity-40'

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="word-popover-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && event.relatedTarget) onClose(false)
      }}
      style={{ top: position?.top ?? 0, left: position?.left ?? 0, visibility: position ? 'visible' : 'hidden' }}
      className="fixed z-50 w-[min(18.5rem,calc(100vw-24px))] animate-pop-in rounded-2xl border border-line bg-raised p-1.5 shadow-pop outline-none"
    >
      <div className="px-3 pb-3 pt-2">
        <p id="word-popover-title" lang={bcp47(wordLang)} className="font-serif text-[1.375rem] leading-tight text-ink">
          {word}
        </p>
        <div className="mt-1 min-h-6 text-[15px] leading-6 text-muted" aria-live="polite">
          {lookup.status === 'success' && <span lang={bcp47(lookupLang)}>{lookup.translation}</span>}
          {lookup.status === 'error' && <span className="text-danger">{lookup.error}</span>}
          {lookup.status === 'loading' && (
            <span className="inline-block h-3 w-28 animate-pulse-soft rounded-full bg-ink/10 align-middle" />
          )}
        </div>
      </div>
      <div className="border-t border-line pt-1.5">
        <button type="button" className={rowClass} disabled={!draft} onClick={toggleSave}>
          <Bookmark
            size={18}
            strokeWidth={1.75}
            aria-hidden
            className={cx(saved ? 'fill-current text-accent' : 'text-muted')}
          />
          {saved ? 'Salvo no vocabulário' : 'Salvar no vocabulário'}
        </button>
        {explainAvailable && (
          <button type="button" className={rowClass} disabled={!translation} onClick={explain}>
            <BookOpen size={18} strokeWidth={1.75} aria-hidden className="text-muted" />
            <span className="flex-1">Ver exemplo e contexto</span>
            <ArrowRight size={16} aria-hidden className="text-subtle" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}
