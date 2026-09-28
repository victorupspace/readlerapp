import { useEffect, useRef } from 'react'
import { Announcer } from './components/Announcer'
import { Footer } from './components/Footer'
import { MobileNav } from './components/MobileNav'
import { SkipLink } from './components/SkipLink'
import { TopBar } from './components/TopBar'
import { TranslatorProvider } from './components/TranslatorProvider'
import { useHashRoute, type Route } from './hooks/useHashRoute'
import { useTheme } from './hooks/useTheme'
import { HistoryPage } from './pages/HistoryPage'
import { TranslatePage } from './pages/TranslatePage'
import { VocabularyPage } from './pages/VocabularyPage'

const TITLES: Record<Route, string> = {
  translate: 'Readler',
  vocabulary: 'Vocabulário · Readler',
  history: 'Histórico · Readler',
}

export default function App() {
  useTheme()
  const route = useHashRoute()
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)

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
      <div className="flex min-h-dvh flex-col">
        <SkipLink />
        <TopBar route={route} />
        <main ref={mainRef} id="conteudo" tabIndex={-1} className="flex-1 outline-none">
          {route === 'translate' && <TranslatePage />}
          {route === 'vocabulary' && <VocabularyPage />}
          {route === 'history' && <HistoryPage />}
        </main>
        <Footer />
        <MobileNav route={route} />
        <Announcer />
      </div>
    </TranslatorProvider>
  )
}
