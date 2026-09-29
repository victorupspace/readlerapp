import { useCallback, useLayoutEffect } from 'react'
import { STORAGE_KEYS } from '../lib/storage'
import { useLocalStorage } from './useLocalStorage'
import { useMediaQuery } from './useMediaQuery'

export type Theme = 'light' | 'dark'

// Browser UI color per theme; keep in sync with the inline script in index.html.
const THEME_COLORS: Record<Theme, string> = { light: '#f3f4f7', dark: '#0f131c' }

const isStoredTheme = (value: unknown): value is Theme | null =>
  value === null || value === 'light' || value === 'dark'

/**
 * Follows the system preference until the user picks a theme with the toggle;
 * the choice is kept in localStorage ("readler:theme").
 */
export function useTheme() {
  const [stored, setStored] = useLocalStorage<Theme | null>(STORAGE_KEYS.theme, null, isStoredTheme)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const theme: Theme = stored ?? (systemDark ? 'dark' : 'light')

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', THEME_COLORS[theme])
    })
  }, [theme])

  const toggle = useCallback(() => setStored(theme === 'dark' ? 'light' : 'dark'), [setStored, theme])

  return { theme, toggle }
}
