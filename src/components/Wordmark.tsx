import { ROUTE_HREFS } from '../hooks/useHashRoute'

/** Plain-text wordmark in the serif face; the accent sits on the final dot. */
export function Wordmark() {
  return (
    <a
      href={ROUTE_HREFS.translate}
      aria-label="Readler, página inicial"
      className="rounded-md font-serif text-[1.625rem] font-medium leading-none tracking-[-0.02em] text-ink"
    >
      Readler<span className="text-accent">.</span>
    </a>
  )
}
