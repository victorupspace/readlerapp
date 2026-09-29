import { ROUTE_HREFS } from '../hooks/useHashRoute'

/** Plain-text wordmark in the serif face; the dot takes the hue of the language being studied. */
export function Wordmark() {
  return (
    <a
      href={ROUTE_HREFS.translate}
      aria-label="Readler, página inicial"
      className="rounded-md font-serif text-[1.625rem] font-medium leading-none tracking-[-0.02em] text-ink"
    >
      Readler<span className="text-hue transition-colors duration-300">.</span>
    </a>
  )
}
