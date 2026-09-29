import { ROUTE_HREFS, type Route } from '../hooks/useHashRoute'
import { cx } from '../lib/misc'
import { NAV_ITEMS } from './navigation'

/** Bottom tab bar on phones, within thumb reach. */
export function MobileNav({ route }: { route: Route }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="mx-auto grid h-[68px] max-w-md grid-cols-3">
        {NAV_ITEMS.map(({ route: itemRoute, label, icon: Icon }) => {
          const current = itemRoute === route
          return (
            <li key={itemRoute}>
              <a
                href={ROUTE_HREFS[itemRoute]}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  'flex h-full flex-col items-center justify-center gap-1 text-[12px] transition-colors duration-150',
                  current ? 'font-semibold text-ink' : 'font-medium text-subtle',
                )}
              >
                <Icon size={22} strokeWidth={current ? 2 : 1.8} aria-hidden />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
