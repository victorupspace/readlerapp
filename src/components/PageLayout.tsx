import { Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconButton } from './IconButton'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[2.25rem] font-semibold leading-[1.1] tracking-[-0.01em] text-ink sm:text-[2.75rem]">
          {title}
        </h1>
        <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-12 border-y border-line py-14 text-center">
      <p className="font-display text-[1.375rem] font-medium text-ink">{title}</p>
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
        className="label-caps inline-flex h-11 shrink-0 items-center rounded-md px-2 text-danger transition-colors duration-150 hover:bg-danger/10"
      >
        Excluir?
      </button>
    )
  }

  return (
    <IconButton label={label} onClick={() => setArmed(true)}>
      <Trash2 size={17} strokeWidth={1.75} aria-hidden />
    </IconButton>
  )
}

export const pageClass = 'mx-auto w-full max-w-[1120px] px-4 pt-8 sm:px-6 sm:pt-14'
