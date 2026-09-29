import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/misc'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  /** CSS colour of the dot that names a language. */
  dot?: string
}

/** Filter pill; the selected one is filled with ink. */
export function Chip({ selected = false, dot, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[14px] font-medium transition-[background-color,border-color,color] duration-150',
        selected ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink',
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden className="size-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  )
}
