import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconButton } from './IconButton'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[36px]">{title}</h1>
        <p className="text-[15px] text-muted">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-surface px-6 py-14 text-center">
      <p className="text-[20px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">{hint}</p>
    </div>
  )
}

/** Trash button that asks "Excluir?" once before deleting. */
export function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!armed) return
    confirmRef.current?.focus()
    const timer = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(timer)
  }, [armed])

  if (armed) {
    return (
      <button
        ref={confirmRef}
        type="button"
        aria-label={`Confirmar: ${label}`}
        onClick={onConfirm}
        onBlur={() => setArmed(false)}
        className="inline-flex h-10 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold text-danger transition-colors duration-150 hover:bg-danger/10"
      >
        Excluir?
      </button>
    )
  }

  return (
    <IconButton label={label} onClick={() => setArmed(true)}>
      <Trash2 size={17} strokeWidth={1.8} aria-hidden />
    </IconButton>
  )
}

export const pageClass = 'mx-auto w-full max-w-[1440px] px-5 pt-7 sm:px-8 sm:pt-10 lg:px-10'
