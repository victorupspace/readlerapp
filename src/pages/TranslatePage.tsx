import { useEffect } from 'react'
import { ExplainSection } from '../components/explain/ExplainSection'
import { TranslatorCard } from '../components/translator/TranslatorCard'
import { useTranslator } from '../hooks/useTranslator'

export function TranslatePage() {
  const { translateNow } = useTranslator()

  // Ctrl/Cmd+Enter translates right away from anywhere on the page
  // (the textarea handles it itself).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
      if (event.target instanceof HTMLTextAreaElement) return
      event.preventDefault()
      translateNow()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [translateNow])

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pt-5 sm:px-6 sm:pt-10">
      <h1 className="sr-only">Traduzir</h1>
      <TranslatorCard />
      <ExplainSection />
    </div>
  )
}
