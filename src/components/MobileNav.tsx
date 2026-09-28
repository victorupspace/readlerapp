import { ROUTE_HREFS, type Route } from '../hooks/useHashRoute'
import { cx } from '../lib/misc'
import { NAV_ITEMS } from './navigation'

/** Bottom tab bar on phones, within thumb reach. */
export function MobileNav({ route }: { route: Route }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-page/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 sm:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-3">
        {NAV_ITEMS.map(({ route: itemRoute, label, icon: Icon }) => {
          const current = itemRoute === route
          return (
            <li key={itemRoute}>
              <a
                href={ROUTE_HREFS[itemRoute]}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-[0.01em] transition-colors duration-150',
                  current ? 'text-accent' : 'text-muted',
                )}
              >
                <Icon size={21} strokeWidth={current ? 2 : 1.75} aria-hidden />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
