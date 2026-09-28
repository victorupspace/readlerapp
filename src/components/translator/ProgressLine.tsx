import { cx } from '../../lib/misc'

/**
 * Thin indeterminate line along the top edge of the translation panel. It fades
 * in after a short delay, so fast responses don't flicker.
 */
export function ProgressLine({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={cx(
        'pointer-events-none absolute inset-x-0 top-0 h-5 overflow-hidden transition-opacity duration-150',
        active ? 'opacity-100 delay-150' : 'opacity-0',
      )}
    >
      <div className="relative h-0.5 overflow-hidden">{active && <div className="progress-line" />}</div>
    </div>
  )
}
