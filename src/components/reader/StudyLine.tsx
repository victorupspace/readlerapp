import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { languageHue } from '../../lib/languages'
import { cx } from '../../lib/misc'
import { tokenize } from '../../lib/text'

interface StudyLineProps {
  text: string
  /** Code of the language being studied, e.g. "FR" or "EN-GB". */
  lang: string
  /** BCP 47 tag for the lang attribute. */
  langTag: string
  /** Word currently open in the margin (only when tapped in this line). */
  selectedWord: string | null
  onWord: (word: string) => void
  className?: string
}

/**
 * One sentence in the language being studied, every word a button. Keyboard:
 * Tab reaches one word per line, arrows move along the line, Enter or Space
 * opens the word. Dragging to select text still works and opens nothing.
 */
export function StudyLine({ text, lang, langTag, selectedWord, onWord, className }: StudyLineProps) {
  const tokens = useMemo(() => tokenize(text), [text])
  const wordIndexes = useMemo(() => tokens.flatMap((token, index) => (token.word ? [index] : [])), [tokens])
  const [focusIndex, setFocusIndex] = useState(-1)
  const containerRef = useRef<HTMLParagraphElement>(null)
  const tabStop = wordIndexes.includes(focusIndex) ? focusIndex : wordIndexes[0]

  const tokenElement = (target: EventTarget) => (target as HTMLElement).closest<HTMLElement>('[data-token]')

  const moveTo = (index: number | undefined) => {
    if (index === undefined) return
    setFocusIndex(index)
    containerRef.current?.querySelector<HTMLElement>(`[data-token="${index}"]`)?.focus()
  }

  const onClick = (event: MouseEvent) => {
    const element = tokenElement(event.target)
    if (!element) return
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return
    const index = Number(element.dataset.token)
    setFocusIndex(index)
    onWord(tokens[index].text)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const element = tokenElement(event.target)
    if (!element) return
    const index = Number(element.dataset.token)
    const position = wordIndexes.indexOf(index)
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        moveTo(wordIndexes[position + 1])
        break
      case 'ArrowLeft':
        event.preventDefault()
        moveTo(wordIndexes[position - 1])
        break
      case 'Home':
        event.preventDefault()
        moveTo(wordIndexes[0])
        break
      case 'End':
        event.preventDefault()
        moveTo(wordIndexes[wordIndexes.length - 1])
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onWord(tokens[index].text)
        break
    }
  }

  return (
    <p
      ref={containerRef}
      lang={langTag}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{ '--hue': languageHue(lang) } as CSSProperties}
      className={cx('whitespace-pre-wrap break-words', className)}
    >
      {tokens.map((token, index) =>
        token.word ? (
          <button
            key={index}
            type="button"
            data-token={index}
            tabIndex={index === tabStop ? 0 : -1}
            aria-expanded={selectedWord !== null && token.text === selectedWord}
            className="word font-[inherit] text-[length:inherit] leading-[inherit] text-inherit"
          >
            {token.text}
          </button>
        ) : (
          token.text
        ),
      )}
    </p>
  )
}
