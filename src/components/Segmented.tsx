import { useRef, type KeyboardEvent } from 'react'
import { cx } from '../lib/misc'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  title?: string
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: readonly SegmentedOption<T>[]
  onChange: (value: T) => void
  className?: string
}

/** Single-choice pill control, built as a radio group (arrow keys move the selection). */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const current = options.findIndex((option) => option.value === value)
    const next = (current + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx('inline-flex shrink-0 items-center rounded-full bg-ink/[0.05] p-0.5', className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cx(
              'hit-area h-8 whitespace-nowrap rounded-full px-3 text-[13px] font-medium transition-colors duration-150',
              checked
                ? 'bg-segment text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--line)]'
                : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
