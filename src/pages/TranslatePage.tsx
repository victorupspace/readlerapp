import { useEffect } from 'react'
import { FormalityToggle } from '../components/FormalityToggle'
import { LanguagePair } from '../components/LanguagePair'
import { Composer } from '../components/reader/Composer'
import { Interlinear } from '../components/reader/Interlinear'
import { MobileStudy } from '../components/reader/MobileStudy'
import { ReaderActions } from '../components/reader/ReaderActions'
import { StudyRail } from '../components/reader/StudyRail'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useTranslator } from '../hooks/useTranslator'

export function TranslatePage() {
  const translator = useTranslator()
  const { translateNow } = translator
  const wide = useMediaQuery('(min-width: 1024px)')

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
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-10 pt-4 sm:px-8 sm:pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-8 lg:px-10 lg:pt-7">
      <h1 className="sr-only">Ler</h1>
      <div className="flex min-w-0 flex-col gap-6 lg:gap-7">
        {!wide && (
          <div className="flex flex-wrap items-center gap-2">
            <LanguagePair className="w-full justify-between sm:w-auto sm:justify-start" />
            <FormalityToggle
              value={translator.formality}
              onChange={translator.setFormality}
              targetLang={translator.targetLang}
            />
          </div>
        )}
        <Composer />
        <Interlinear />
        <ReaderActions />
        {!wide && <MobileStudy />}
      </div>
      {wide && <StudyRail />}
    </div>
  )
}
