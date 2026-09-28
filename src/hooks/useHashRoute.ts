import { useSyncExternalStore } from 'react'

// Hash routes (#/vocabulario) work on any static host, GitHub Pages included,
// without server rewrites.

export type Route = 'translate' | 'vocabulary' | 'history'

export const ROUTE_HREFS: Record<Route, string> = {
  translate: '#/',
  vocabulary: '#/vocabulario',
  history: '#/historico',
}

function parse(hash: string): Route {
  switch (hash.replace(/^#\/?/, '').replace(/\/$/, '')) {
    case 'vocabulario':
      return 'vocabulary'
    case 'historico':
      return 'history'
    default:
      return 'translate'
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useHashRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => parse(window.location.hash),
    () => 'translate',
  )
}

export function navigate(route: Route): void {
  window.location.hash = ROUTE_HREFS[route].slice(1)
}
