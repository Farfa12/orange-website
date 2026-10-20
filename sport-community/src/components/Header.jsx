import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Header({ title }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-4 pb-3 pt-4 backdrop-blur dark:border-night-line dark:bg-night/90 sm:pt-8">
      <h1 className="truncate text-xl font-bold tracking-tight text-night dark:text-white">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-soft"
        >
          {isDark ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
        </button>
        <Link
          to="/profil"
          aria-label="Ouvrir mon profil"
          className="flex min-h-tap min-w-tap items-center justify-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-night ring-2 ring-primary-light dark:ring-night-soft">
            LM
          </span>
        </Link>
      </div>
    </header>
  )
}
