import { BookMarked, History, Languages, type LucideIcon } from 'lucide-react'
import type { Route } from '../hooks/useHashRoute'

export const NAV_ITEMS: { route: Route; label: string; icon: LucideIcon }[] = [
  { route: 'translate', label: 'Traduzir', icon: Languages },
  { route: 'vocabulary', label: 'Vocabulário', icon: BookMarked },
  { route: 'history', label: 'Histórico', icon: History },
]
