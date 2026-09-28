import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/misc'

interface ActionLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Highlights the action (speaking, saved, copied…). */
  active?: boolean
  icon?: ReactNode
}

/** Small-caps text action: the edition's equivalent of a toolbar button, 44px tall. */
export function ActionLink({ active = false, icon, className, children, ...props }: ActionLinkProps) {
  return (
    <button
      type="button"
      className={cx(
        'label-caps inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2 transition-[color,transform] duration-150',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35',
        active ? 'text-accent' : 'text-muted hover:text-ink',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
