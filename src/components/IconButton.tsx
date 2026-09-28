import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/misc'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name, also shown as a tooltip. */
  label: string
  /** Highlights the button (speaking, saved…). */
  active?: boolean
}

export function IconButton({ label, active = false, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-150',
        'hover:bg-ink/[0.06] active:scale-[0.92] disabled:pointer-events-none disabled:opacity-35',
        active ? 'text-accent' : 'text-muted hover:text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
