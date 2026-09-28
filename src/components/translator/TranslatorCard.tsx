import { SourcePanel } from './SourcePanel'
import { TargetPanel } from './TargetPanel'

/**
 * The bilingual edition: two facing pages inside a hairline frame, the source
 * on the left and the translation on the right, stacked on phones.
 */
export function TranslatorCard() {
  return (
    <section
      aria-label="Tradutor"
      className="border border-line bg-surface transition-[border-color] duration-200 has-[textarea:focus]:border-line-focus"
    >
      <div className="grid md:grid-cols-2">
        <SourcePanel />
        <TargetPanel />
      </div>
    </section>
  )
}
