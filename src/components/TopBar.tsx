import { ROUTE_HREFS, type Route } from '../hooks/useHashRoute'
import { cx } from '../lib/misc'
import { NAV_ITEMS } from './navigation'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Wordmark'

export function TopBar({ route }: { route: Route }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-12 px-4 sm:h-16 sm:px-6">
        <Wordmark />
        <nav aria-label="Principal" className="hidden h-full items-stretch gap-8 sm:flex">
          {NAV_ITEMS.map(({ route: itemRoute, label }) => {
            const current = itemRoute === route
            return (
              <a
                key={itemRoute}
                href={ROUTE_HREFS[itemRoute]}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'label-caps-lg relative inline-flex items-center transition-colors duration-150',
                  current ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {label}
                {current && (
                  <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </a>
            )
          })}
        </nav>
        <div className="-mr-2 ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
