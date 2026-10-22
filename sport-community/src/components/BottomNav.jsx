import { NavLink } from 'react-router-dom'
import { Map, Users, CalendarDays, Compass } from 'lucide-react'

export const TABS = [
  { to: '/', label: 'Ma Carte', icon: Map, end: true },
  { to: '/communaute', label: 'Communauté', icon: Users },
  { to: '/evenements', label: 'Événements', icon: CalendarDays },
  { to: '/explorer', label: 'Explorer & Réserver', icon: Compass },
]

export default function BottomNav() {
  return (
    <nav
      aria-label="Navigation principale"
      className="border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-night-line dark:bg-night"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-medium leading-tight transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-night dark:text-slate-400 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
