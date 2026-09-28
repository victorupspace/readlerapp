import { useUsage } from '../hooks/useUsage'
import { formatNumber } from '../lib/format'

export function Footer() {
  const usage = useUsage()
  return (
    <footer className="mx-auto w-full max-w-[1120px] px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-16 sm:px-6 sm:pb-10">
      <div className="flex flex-col items-center gap-1 text-center text-[13px] text-subtle sm:flex-row sm:justify-between sm:text-left">
        <p className="tabular-nums">
          {usage
            ? `${formatNumber(usage.character_count)} de ${formatNumber(usage.character_limit)} caracteres usados este mês`
            : ' '}
        </p>
        <p className="font-serif text-[15px] italic">Leia, traduza, aprenda.</p>
      </div>
    </footer>
  )
}
