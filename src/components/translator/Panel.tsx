import type { ReactNode } from 'react'
import { cx } from '../../lib/misc'

// Shared rhythm for both panels: header (language), body (text), toolbar (actions).
// Horizontal paddings line the language label, the text and the first icon up.

export function PanelHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex h-14 min-w-0 items-center gap-3 border-b border-line px-5 sm:h-16 sm:px-7', className)}>
      {children}
    </div>
  )
}

export function PanelToolbar({ children }: { children: ReactNode }) {
  return <div className="flex h-14 items-center gap-0.5 px-2 sm:h-16 sm:px-4">{children}</div>
}

export const panelTextClass = 'text-[18px] leading-[1.6] text-ink md:text-[22px]'
export const panelBodyClass = 'flex-1 px-5 pb-2 pt-4 sm:px-7 sm:pt-5 min-h-[180px] md:min-h-[280px]'
