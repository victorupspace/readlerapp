import type { Formality, TargetLang } from '../lib/languages'
import { Segmented } from './Segmented'

const PRONOUNS: Record<string, Record<Formality, string>> = {
  FR: { prefer_more: 'vous', prefer_less: 'tu' },
  DE: { prefer_more: 'Sie', prefer_less: 'du' },
}

interface FormalityToggleProps {
  value: Formality
  onChange: (value: Formality) => void
  targetLang: TargetLang
  className?: string
}

/** Formal / Informal for French (vous/tu) and German (Sie/du), via DeepL prefer_more / prefer_less. */
export function FormalityToggle({ value, onChange, targetLang, className }: FormalityToggleProps) {
  const pronouns = PRONOUNS[targetLang]
  return (
    <Segmented
      label="Tratamento"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: 'prefer_more', label: 'Formal', title: pronouns && `Formal (${pronouns.prefer_more})` },
        { value: 'prefer_less', label: 'Informal', title: pronouns && `Informal (${pronouns.prefer_less})` },
      ]}
    />
  )
}
