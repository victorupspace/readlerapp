import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../lib/misc'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name, also shown as a tooltip. */
  label: string
  /** Highlights the button in the language hue (favourite, speaking…). */
  active?: boolean
  /** Outlined on a surface, for the top bar. */
  outlined?: boolean
}

export function IconButton({ label, active = false, outlined = false, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color,transform] duration-150',
        'active:scale-[0.92] disabled:pointer-events-none disabled:opacity-35',
        outlined ? 'border border-line bg-surface hover:border-line-strong' : 'hover:bg-ink/6',
        active ? 'text-hue' : 'text-muted hover:text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
