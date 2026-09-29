import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/misc'

type Variant = 'primary' | 'ghost' | 'text'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  /** Highlights the action in the language hue (saved, speaking, copied). */
  active?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:opacity-90',
  ghost: 'border border-line bg-surface text-ink hover:border-line-strong',
  text: 'text-muted hover:text-ink',
}

const SIZES: Record<Size, string> = {
  md: 'h-10 px-4 text-[14px]',
  sm: 'h-8 px-3 text-[13px]',
}

/** Pill button in three weights: primary (ink), ghost (outlined) and text. */
export function Button({ variant = 'ghost', size = 'md', icon, active = false, className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,border-color,color,opacity,transform] duration-150',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        variant === 'text' && (size === 'md' ? 'px-2.5' : 'px-2'),
        active && variant !== 'primary' && 'text-hue hover:text-hue',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
