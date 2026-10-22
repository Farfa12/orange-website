import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'
import { useApp } from '../context/AppContext.jsx'

const iconBtn =
  'flex min-h-tap min-w-tap items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-night-soft'

export default function Header({ title, back = false }) {
  const { theme, toggleTheme } = useTheme()
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  return (
    <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-2 pb-2 pt-3 backdrop-blur dark:border-night-line dark:bg-night/90 sm:pt-7">
      <div className="flex min-w-0 items-center">
        {back ? (
          <button type="button" onClick={() => navigate(-1)} aria-label="Retour" className={iconBtn}>
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
        ) : (
          <span className="w-2" />
        )}
        <h1 className="truncate text-xl font-bold tracking-tight text-night dark:text-white">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
          className={iconBtn}
        >
          {isDark ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}
        </button>
        <Link to="/profil" aria-label="Ouvrir mon profil" className="flex min-h-tap min-w-tap items-center justify-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-primary-light dark:ring-night-soft"
            style={{ backgroundColor: currentUser.avatar.couleur }}
          >
            {currentUser.avatar.initiales}
          </span>
        </Link>
      </div>
    </header>
  )
}
