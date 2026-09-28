import { CircleAlert } from 'lucide-react'
import { cx } from '../lib/misc'

interface InlineErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

/** Friendly error shown in place of content, with an optional retry. */
export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div role="alert" className={cx('flex items-start gap-3 text-[15px] leading-relaxed', className)}>
      <CircleAlert size={18} aria-hidden className="mt-[3px] shrink-0 text-danger" />
      <div>
        <p className="text-ink">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded text-[14px] font-medium text-accent underline-offset-4 hover:underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}
