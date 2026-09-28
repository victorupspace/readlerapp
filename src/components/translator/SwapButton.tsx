import { ArrowLeftRight } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { cx } from '../../lib/misc'

interface SwapButtonProps {
  onSwap: () => void
  disabled: boolean
  className?: string
}

/** Small round button on the rule between the pages; the arrows turn half a turn per click. */
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
        'hit-area absolute z-10 inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-muted',
        'transition-[color,border-color,transform] duration-150 hover:border-line-strong hover:text-ink active:scale-95 disabled:text-subtle/50 disabled:hover:border-line',
        className,
      )}
    >
      <ArrowLeftRight
        size={15}
        strokeWidth={1.75}
        aria-hidden
        style={{ '--turns': turns } as CSSProperties}
        className="rotate-[calc(var(--turns)*180deg+90deg)] transition-transform duration-200 ease-[var(--ease-calm)] md:rotate-[calc(var(--turns)*180deg)]"
      />
    </button>
  )
}
