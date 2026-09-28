/** Placeholder with the shape of grammar chips, two examples and a note. */
export function ExplainSkeleton() {
  return (
    <div className="animate-pulse-soft">
      <span className="sr-only">Gerando exemplo e contexto…</span>
      <div aria-hidden>
        <div className="mt-5 flex gap-2">
          <div className="h-7 w-36 rounded-full bg-ink/[0.07]" />
          <div className="h-7 w-28 rounded-full bg-ink/[0.07]" />
        </div>
        <div className="mt-6 border-t border-line">
          {[0, 1].map((row) => (
            <div key={row} className="space-y-3 border-b border-line py-6 last:border-b-0">
              <div className="h-5 w-[82%] rounded-md bg-ink/[0.08]" />
              <div className="h-4 w-[58%] rounded-md bg-ink/[0.06]" />
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2.5 border-l-2 border-line pl-4">
          <div className="h-4 w-[74%] rounded-md bg-ink/[0.06]" />
          <div className="h-4 w-[46%] rounded-md bg-ink/[0.06]" />
        </div>
      </div>
    </div>
  )
}
