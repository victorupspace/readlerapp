import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { cx } from '../../lib/misc'
import { tokenize } from '../../lib/text'

interface TappableTextProps {
  text: string
  lang: string
  /** Token index of the word whose popover is open. */
  selectedIndex: number | null
  onWord: (word: string, index: number, anchor: HTMLElement) => void
  className?: string
}

/**
 * The translation, with every word tappable. Keyboard: Tab reaches one word,
 * arrows move between words, Enter or Space opens it. Dragging to select text
 * still works and doesn't open anything.
 */
export function TappableText({ text, lang, selectedIndex, onWord, className }: TappableTextProps) {
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
    onWord(tokens[index].text, index, element)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const element = tokenElement(event.target)
    if (!element) return
    const index = Number(element.dataset.token)
    const position = wordIndexes.indexOf(index)
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        moveTo(wordIndexes[position + 1])
        break
      case 'ArrowLeft':
      case 'ArrowUp':
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
        onWord(tokens[index].text, index, element)
        break
    }
  }

  return (
    <p
      ref={containerRef}
      lang={lang}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cx('whitespace-pre-wrap break-words', className)}
    >
      {tokens.map((token, index) =>
        token.word ? (
          <span
            key={index}
            data-token={index}
            role="button"
            tabIndex={index === tabStop ? 0 : -1}
            aria-haspopup="dialog"
            aria-expanded={index === selectedIndex}
            className={cx(
              'rounded-[3px] decoration-subtle/70 decoration-dotted underline-offset-[5px] transition-colors duration-150 hover:underline focus-visible:outline-offset-1',
              index === selectedIndex && 'bg-accent/12',
            )}
          >
            {token.text}
          </span>
        ) : (
          token.text
        ),
      )}
    </p>
  )
}
