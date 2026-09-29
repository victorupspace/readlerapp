import { useEffect, useLayoutEffect, useRef } from 'react'
import { Announcer } from './components/Announcer'
import { MobileNav } from './components/MobileNav'
import { SkipLink } from './components/SkipLink'
import { TopBar } from './components/TopBar'
import { TranslatorProvider } from './components/TranslatorProvider'
import { useHashRoute, type Route } from './hooks/useHashRoute'
import { useTheme } from './hooks/useTheme'
import { useTranslator } from './hooks/useTranslator'
import { warmUp } from './lib/api'
import { languageHue } from './lib/languages'
import { HistoryPage } from './pages/HistoryPage'
import { TranslatePage } from './pages/TranslatePage'
import { VocabularyPage } from './pages/VocabularyPage'

const TITLES: Record<Route, string> = {
  translate: 'Readler',
  vocabulary: 'Vocabulário · Readler',
  history: 'Histórico · Readler',
}

/** Keeps `--hue` on <html> in step with the language being studied. */
function HueSync() {
  const { studyLang } = useTranslator()
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--hue', languageHue(studyLang))
  }, [studyLang])
  return null
}

export default function App() {
  useTheme()
  const route = useHashRoute()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

  // Functions idle out after a few minutes; a ping on load and on return keeps them warm.
  useEffect(() => {
    let last = 0
    const ping = () => {
      if (Date.now() - last < 3 * 60_000) return
      last = Date.now()
      warmUp()
    }
    ping()
    window.addEventListener('focus', ping)
    return () => window.removeEventListener('focus', ping)
  }, [])

  useEffect(() => {
    document.title = TITLES[route]
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // New page: start at the top and move focus to it for screen readers.
    window.scrollTo(0, 0)
    mainRef.current?.focus({ preventScroll: true })
  }, [route])

  return (
    <TranslatorProvider>
      <HueSync />
      <div className="flex min-h-dvh flex-col pb-[calc(env(safe-area-inset-bottom)+68px)] sm:pb-0">
        <SkipLink />
        <TopBar route={route} />
        <main ref={mainRef} id="conteudo" tabIndex={-1} className="flex-1 outline-none">
          {route === 'translate' && <TranslatePage />}
          {route === 'vocabulary' && <VocabularyPage />}
          {route === 'history' && <HistoryPage />}
        </main>
        <MobileNav route={route} />
        <Announcer />
      </div>
    </TranslatorProvider>
  )
}
