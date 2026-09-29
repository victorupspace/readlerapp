import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton label={dark ? 'Usar tema claro' : 'Usar tema escuro'} onClick={toggle} outlined className="text-ink">
      <span key={theme} className="inline-flex animate-swap-in">
        {dark ? <Sun size={18} strokeWidth={1.8} aria-hidden /> : <Moon size={18} strokeWidth={1.8} aria-hidden />}
      </span>
    </IconButton>
  )
}
