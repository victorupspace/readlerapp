import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { LanguageOption } from '../lib/languages'
import { cx } from '../lib/misc'

interface LanguageSelectProps<T extends string> {
  id: string
  /** Accessible label, e.g. "Idioma de origem". */
  label: string
  value: T
  options: readonly LanguageOption<T>[]
  onChange: (value: T) => void
  /** Replaces the selected label on the button (e.g. "Français (detectado)"). */
  display?: ReactNode
  /** Draws a hairline under this option. */
  dividerAfter?: T
  className?: string
}

/** Dropdown button + listbox, keyboard navigable (arrows, Home/End, type-ahead, Enter, Esc). */
export function LanguageSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  display,
  dividerAfter,
  className,
}: LanguageSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.code === value),
  )

  const openList = () => {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  const close = (restoreFocus: boolean) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const choose = (index: number) => {
    onChange(options[index].code)
    close(true)
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const onButtonKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openList()
    }
  }

  const onListKeyDown = (event: KeyboardEvent) => {
    const last = options.length - 1
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => (index === last ? 0 : index + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => (index === 0 ? last : index - 1))
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(last)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(activeIndex)
        break
      case 'Escape':
        event.preventDefault()
        close(true)
        break
      case 'Tab':
        close(false)
        break
      default:
        if (event.key.length === 1) {
          const letter = event.key.toLowerCase()
          const match = options.findIndex((option) => option.label.toLowerCase().startsWith(letter))
          if (match >= 0) setActiveIndex(match)
        }
    }
  }

  return (
    <div ref={rootRef} className={cx('relative -ml-3 min-w-0', className)}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={`${id}-button`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-labelledby={`${id}-label ${id}-button`}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onButtonKeyDown}
        className="inline-flex h-11 max-w-full items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-ink/[0.05]"
      >
        <span className="truncate">{display ?? options[selectedIndex]?.label}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cx('shrink-0 text-subtle transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-option-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className="absolute left-0 top-full z-40 mt-1 min-w-56 origin-top-left animate-pop-in rounded-2xl border border-line bg-raised p-1.5 shadow-pop outline-none"
        >
          {options.map((option, index) => {
            const selected = option.code === value
            return (
              <li
                key={option.code}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected}
                onClick={() => choose(index)}
                onPointerMove={() => setActiveIndex(index)}
                className={cx(
                  'relative flex h-11 select-none items-center justify-between gap-6 rounded-xl px-3 text-[15px]',
                  index === activeIndex && 'bg-ink/[0.05]',
                  selected ? 'font-medium text-ink' : 'text-muted',
                  dividerAfter === option.code &&
                    'mb-2 after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-1 after:h-px after:bg-line',
                )}
              >
                {option.label}
                {selected && <Check size={16} className="text-accent" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
