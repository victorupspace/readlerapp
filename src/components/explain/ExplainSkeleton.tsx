/**
 * Placeholder with the shape of a dictionary entry: grammar line, two numbered
 * examples, a note. `examplesOnly` keeps just the two examples.
 */
export function ExplainSkeleton({ examplesOnly = false }: { examplesOnly?: boolean }) {
  const rows = (
    <div className="mt-4 sm:mt-0">
      {[0, 1].map((row) => (
        <div
          key={row}
          className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 py-4 first:pt-1 [&+div]:border-t [&+div]:border-line"
        >
          <div className="mt-1 h-3.5 w-3 rounded bg-ink/[0.07]" />
          <div>
            <div className="h-5 w-[78%] rounded bg-ink/[0.08]" />
            <div className="mt-2.5 h-4 w-[54%] rounded bg-ink/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="animate-pulse-soft">
      <span className="sr-only">{examplesOnly ? 'Buscando exemplos…' : 'Gerando verbete…'}</span>
      {examplesOnly ? (
        <div aria-hidden className="mt-5 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4">
          <div />
          {rows}
        </div>
      ) : (
        <div aria-hidden>
          <div className="sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4">
            <div />
            <div className="mt-3 h-4 w-56 rounded bg-ink/[0.07]" />
          </div>
          <div className="mt-8 border-t border-line pt-5 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4">
            <div className="h-3 w-14 rounded bg-ink/[0.07]" />
            {rows}
          </div>
          <div className="mt-6 border-t border-line pt-5 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-4">
            <div className="h-3 w-10 rounded bg-ink/[0.07]" />
            <div className="mt-4 space-y-2.5 sm:mt-0">
              <div className="h-4 w-[70%] rounded bg-ink/[0.06]" />
              <div className="h-4 w-[42%] rounded bg-ink/[0.06]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
