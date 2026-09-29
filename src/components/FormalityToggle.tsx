import type { Formality, TargetLang } from '../lib/languages'
import { Segmented } from './Segmented'

const PRONOUNS: Record<string, { informal: string; formal: string }> = {
  FR: { informal: 'tu', formal: 'vous' },
  DE: { informal: 'du', formal: 'Sie' },
}

interface FormalityToggleProps {
  value: Formality
  onChange: (value: Formality) => void
  targetLang: TargetLang
  className?: string
}

/** The pronoun itself is the label: tu | vous, du | Sie (DeepL prefer_less / prefer_more). */
export function FormalityToggle({ value, onChange, targetLang, className }: FormalityToggleProps) {
  const pronouns = PRONOUNS[targetLang]
  if (!pronouns) return null
  return (
    <Segmented
      label="Tratamento"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: 'prefer_less', label: pronouns.informal, title: 'Informal' },
        { value: 'prefer_more', label: pronouns.formal, title: 'Formal' },
      ]}
    />
  )
}
