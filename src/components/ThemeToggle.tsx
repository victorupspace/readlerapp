import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <IconButton label={dark ? 'Usar tema claro' : 'Usar tema escuro'} onClick={toggle}>
      <span key={theme} className="inline-flex animate-swap-in">
        {dark ? <Sun size={19} strokeWidth={1.75} aria-hidden /> : <Moon size={19} strokeWidth={1.75} aria-hidden />}
      </span>
    </IconButton>
  )
}
