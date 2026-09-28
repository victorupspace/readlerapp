import type { ReactNode } from 'react'
import { cx } from '../../lib/misc'

// The two pages of the edition share one rhythm: a running head with the
// language, the text block, and a foot line of small-caps actions. Paddings
// line the running head, the text and the first action up on the left.

export function RunningHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex h-12 min-w-0 items-center gap-3 border-b border-line px-5 sm:px-7', className)}>
      {children}
    </div>
  )
}

export function PageFoot({ children }: { children: ReactNode }) {
  return <div className="flex h-12 items-center gap-1 px-3 sm:px-5">{children}</div>
}

export const pageTextClass = 'text-[18px] leading-[1.6] text-ink md:text-[21px]'
export const pageBodyClass = 'flex-1 px-5 pb-2 pt-5 sm:px-7 min-h-[176px] md:min-h-[272px]'
