import { Fragment, useRef, type KeyboardEvent } from 'react'
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

/**
 * Single choice set in small caps, "FORMAL · INFORMAL", the current one
 * underlined in the accent. A radio group: arrow keys move the selection.
 */
export function Segmented<T extends string>({ label, value, options, onChange, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
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
      className={cx('inline-flex shrink-0 items-center', className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value
        return (
          <Fragment key={option.value}>
            {index > 0 && (
              <span aria-hidden className="px-1 text-[13px] text-subtle">
                ·
              </span>
            )}
            <button
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
                'label-caps relative h-11 whitespace-nowrap rounded-md px-1.5 transition-colors duration-150',
                checked
                  ? 'text-ink after:absolute after:inset-x-1.5 after:bottom-[11px] after:h-px after:bg-accent'
                  : 'text-muted hover:text-ink',
              )}
            >
              {option.label}
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
