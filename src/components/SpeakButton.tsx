import { Snail, Square, Volume2 } from 'lucide-react'
import { NORMAL_RATE, SLOW_RATE, useSpeech } from '../hooks/useSpeech'
import { IconButton } from './IconButton'

interface SpeakButtonProps {
  /** Unique per button, so only the one playing shows the stop state. */
  id: string
  text: string
  /** Any Readler language code; picks the matching voice (fr-FR, de-DE, en-US, pt-BR…). */
  lang: string
  label: string
  slow?: boolean
  disabled?: boolean
  className?: string
}

export function SpeakButton({ id, text, lang, label, slow = false, disabled = false, className }: SpeakButtonProps) {
  const { supported, speakingId, speak } = useSpeech()
  if (!supported) return null

  const speaking = speakingId === id
  return (
    <IconButton
      label={speaking ? 'Parar leitura' : label}
      active={speaking}
      disabled={disabled || !text.trim() || !lang}
      onClick={() => speak(id, text, lang, slow ? SLOW_RATE : NORMAL_RATE)}
      className={className}
    >
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
