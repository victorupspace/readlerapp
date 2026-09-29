import { ROUTE_HREFS, type Route } from '../hooks/useHashRoute'
import { useTranslator } from '../hooks/useTranslator'
import { cx } from '../lib/misc'
import { FormalityToggle } from './FormalityToggle'
import { LanguagePair } from './LanguagePair'
import { NAV_ITEMS } from './navigation'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Wordmark'

export function TopBar({ route }: { route: Route }) {
  const translator = useTranslator()
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-6 px-5 sm:px-8 lg:px-10">
        <Wordmark />

        {route === 'translate' && (
          <div className="ml-2 hidden items-center gap-2.5 lg:flex">
            <LanguagePair />
            <FormalityToggle
              value={translator.formality}
              onChange={translator.setFormality}
              targetLang={translator.targetLang}
            />
          </div>
        )}

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-7 sm:flex">
          {NAV_ITEMS.map(({ route: itemRoute, label }) => {
            const current = itemRoute === route
            return (
              <a
                key={itemRoute}
                href={ROUTE_HREFS[itemRoute]}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'text-[15px] font-medium transition-colors duration-150',
                  current ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {label}
              </a>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center sm:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
