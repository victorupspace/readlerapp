import { ArrowLeftRight } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { cx } from '../../lib/misc'

interface SwapButtonProps {
  onSwap: () => void
  disabled: boolean
  className?: string
}

/** Round button on the divider; the arrows turn half a turn per click (vertical on phones). */
export function SwapButton({ onSwap, disabled, className }: SwapButtonProps) {
  const [turns, setTurns] = useState(0)
  return (
    <button
      type="button"
      aria-label="Inverter idiomas"
      title="Inverter idiomas"
      disabled={disabled}
      onClick={() => {
        setTurns((count) => count + 1)
        onSwap()
      }}
      className={cx(
        'absolute z-10 inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-[0_1px_3px_rgb(0_0_0/0.06)]',
        'transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:text-subtle/50 disabled:hover:border-line',
        className,
      )}
    >
      <ArrowLeftRight
        size={18}
        strokeWidth={1.75}
        aria-hidden
        style={{ '--turns': turns } as CSSProperties}
        className="rotate-[calc(var(--turns)*180deg+90deg)] transition-transform duration-200 ease-[var(--ease-calm)] md:rotate-[calc(var(--turns)*180deg)]"
      />
    </button>
  )
}
