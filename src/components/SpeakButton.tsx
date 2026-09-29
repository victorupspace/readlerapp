import { Snail, Square, Volume2 } from 'lucide-react'
import { NORMAL_RATE, SLOW_RATE, useSpeech } from '../hooks/useSpeech'
import { Button } from './Button'
import { IconButton } from './IconButton'

interface SpeakButtonProps {
  /** Unique per button, so only the one playing shows the stop state. */
  id: string
  text: string
  /** Any Readler language code; picks the matching voice (fr-FR, de-DE, en-US, pt-BR…). */
  lang: string
  /** Accessible name, e.g. "Ouvir tradução". */
  label: string
  /** Visible text of the pill variants; defaults to Ouvir / Devagar. */
  children?: string
  slow?: boolean
  disabled?: boolean
  variant?: 'icon' | 'ghost' | 'text'
  size?: 'md' | 'sm'
  className?: string
}

export function SpeakButton({
  id,
  text,
  lang,
  label,
  children,
  slow = false,
  disabled = false,
  variant = 'ghost',
  size = 'md',
  className,
}: SpeakButtonProps) {
  const { supported, speakingId, speak } = useSpeech()
  if (!supported) return null

  const speaking = speakingId === id
  const name = speaking ? 'Parar leitura' : label
  const isDisabled = disabled || !text.trim() || !lang
  const onClick = () => speak(id, text, lang, slow ? SLOW_RATE : NORMAL_RATE)
  const iconSize = variant === 'icon' ? 19 : 16
  const icon = speaking ? (
    <Square size={iconSize - 5} fill="currentColor" aria-hidden />
  ) : slow ? (
    <Snail size={iconSize} strokeWidth={1.8} aria-hidden />
  ) : (
    <Volume2 size={iconSize} strokeWidth={1.8} aria-hidden />
  )

  if (variant === 'icon') {
    return (
      <IconButton label={name} active={speaking} disabled={isDisabled} onClick={onClick} className={className}>
        {icon}
      </IconButton>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={name}
      title={name}
      active={speaking}
      disabled={isDisabled}
      onClick={onClick}
      icon={icon}
      className={className}
    >
      {speaking ? 'Parar' : (children ?? (slow ? 'Devagar' : 'Ouvir'))}
    </Button>
  )
}
