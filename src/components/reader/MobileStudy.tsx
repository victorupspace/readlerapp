import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useStudySubject } from '../../hooks/useStudySubject'
import { useTranslator } from '../../hooks/useTranslator'
import { StudyPanel } from './StudyPanel'

/**
 * The study margin on phones: a sheet that rises when a word is tapped, and,
 * for the text itself (a single word, or a short text with the Verbete), a
 * section under the reading.
 */
export function MobileStudy() {
  const subject = useStudySubject()
  const { focus, focusWord } = useTranslator()
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!focus) return
    sheetRef.current?.focus({ preventScroll: true })
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [focus])

  if (focus && subject.kind === 'word') {
    const close = () => focusWord(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    return (
      <div className="fixed inset-0 z-40 flex flex-col justify-end">
        <button type="button" aria-label="Fechar" onClick={close} className="absolute inset-0 bg-ink/40 animate-fade" />
        <div
          ref={sheetRef}
          role="dialog"
          aria-label="Palavra"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="relative max-h-[78dvh] animate-rise overflow-y-auto rounded-t-[28px] border-t border-line bg-surface px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3 shadow-sheet outline-none"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="mx-auto mb-4 block h-6 w-16 rounded-full"
          >
            <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-ink/20" />
          </button>
          <StudyPanel subject={subject} size="sheet" />
        </div>
      </div>
    )
  }

  if (subject.kind === 'text' || subject.canGenerate) {
    return (
      <section aria-label="Margem de estudo" className="rounded-[20px] border border-line bg-surface p-5 shadow-card">
        <StudyPanel subject={subject} size="sheet" />
      </section>
    )
  }

  return null
}
