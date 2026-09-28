import { SourcePanel } from './SourcePanel'
import { TargetPanel } from './TargetPanel'

/** One card, two equal panels: side by side on desktop, stacked on phones. */
export function TranslatorCard() {
  return (
    <section
      aria-label="Tradutor"
      className="rounded-[20px] border border-line bg-surface shadow-card transition-colors duration-200 has-[textarea:focus]:border-line-strong"
    >
      <div className="grid md:grid-cols-2">
        <SourcePanel />
        <TargetPanel />
      </div>
    </section>
  )
}
