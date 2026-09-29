import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslator } from '../../hooks/useTranslator'
import { announce } from '../../lib/announce'
import { Button } from '../Button'
import { SpeakButton } from '../SpeakButton'

/** Listen, listen slowly and copy, for the whole translation. */
export function ReaderActions({ hint }: { hint?: string }) {
  const translator = useTranslator()
  const result = translator.error ? null : translator.result
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  if (!result) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.translation)
      setCopied(true)
      announce('Tradução copiada')
    } catch {
      announce('Não foi possível copiar')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-1 sm:px-2">
      <SpeakButton id="target" text={result.translation} lang={result.targetLang} label="Ouvir tradução">
        Ouvir tradução
      </SpeakButton>
      <SpeakButton id="target-slow" text={result.translation} lang={result.targetLang} label="Ouvir devagar" slow />
      <Button
        aria-label={copied ? 'Copiado' : 'Copiar tradução'}
        active={copied}
        onClick={copy}
        icon={copied ? <Check size={16} strokeWidth={2.2} aria-hidden /> : <Copy size={16} strokeWidth={1.8} aria-hidden />}
      >
        {copied ? 'Copiado' : 'Copiar tradução'}
      </Button>
      {hint && <span className="ml-auto hidden text-[13px] text-subtle lg:inline">{hint}</span>}
    </div>
  )
}
