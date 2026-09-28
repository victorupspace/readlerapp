import { Snail, Square, Volume2 } from 'lucide-react'
import { NORMAL_RATE, SLOW_RATE, useSpeech } from '../hooks/useSpeech'
import { ActionLink } from './ActionLink'
import { IconButton } from './IconButton'

interface SpeakButtonProps {
  /** Unique per button, so only the one playing shows the stop state. */
  id: string
  text: string
  /** Any Readler language code; picks the matching voice (fr-FR, de-DE, en-US, pt-BR…). */
  lang: string
  /** Accessible name, e.g. "Ouvir tradução". */
  label: string
  slow?: boolean
  disabled?: boolean
  /** "text" is a small-caps word (Ouvir / Devagar); "icon" a round icon button. */
  variant?: 'icon' | 'text'
  className?: string
}

export function SpeakButton({
  id,
  text,
  lang,
  label,
  slow = false,
  disabled = false,
  variant = 'icon',
  className,
}: SpeakButtonProps) {
  const { supported, speakingId, speak } = useSpeech()
  if (!supported) return null

  const speaking = speakingId === id
  const name = speaking ? 'Parar leitura' : label
  const isDisabled = disabled || !text.trim() || !lang
  const onClick = () => speak(id, text, lang, slow ? SLOW_RATE : NORMAL_RATE)

  if (variant === 'text') {
    return (
      <ActionLink
        aria-label={name}
        title={name}
        active={speaking}
        disabled={isDisabled}
        onClick={onClick}
        className={className}
        icon={
          speaking ? (
            <Square size={11} fill="currentColor" aria-hidden />
          ) : slow ? (
            <Snail size={15} strokeWidth={1.75} aria-hidden />
          ) : (
            <Volume2 size={15} strokeWidth={1.75} aria-hidden />
          )
        }
      >
        {speaking ? 'Parar' : slow ? 'Devagar' : 'Ouvir'}
      </ActionLink>
    )
  }

  return (
    <IconButton label={name} active={speaking} disabled={isDisabled} onClick={onClick} className={className}>
      {speaking ? (
        <Square size={15} fill="currentColor" aria-hidden />
      ) : slow ? (
        <Snail size={20} strokeWidth={1.75} aria-hidden />
      ) : (
        <Volume2 size={20} strokeWidth={1.75} aria-hidden />
      )}
    </IconButton>
  )
}
