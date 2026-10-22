import { Link } from 'react-router-dom'
import { BadgeCheck, FlaskConical, Megaphone } from 'lucide-react'
import { NON_RENSEIGNE } from '../lib/format.js'

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-night hover:bg-primary-dark',
  cta: 'bg-cta text-night hover:bg-cta-dark',
  outline:
    'border border-slate-300 bg-white text-night hover:bg-slate-50 dark:border-night-line dark:bg-night-soft dark:text-slate-100 dark:hover:bg-night-line',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-night-soft',
  danger: 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950',
}

// Bouton accessible (min 44px). Devient un lien si "to" ou "href" est fourni.
export function Button({ variant = 'primary', to, href, className = '', children, full = false, ...props }) {
  const cls = `inline-flex min-h-tap items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    BUTTON_VARIANTS[variant]
  } ${full ? 'w-full' : ''} ${className}`
  if (to) return <Link to={to} className={cls} {...props}>{children}</Link>
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props}>{children}</a>
  return <button type="button" className={cls} {...props}>{children}</button>
}

const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-night-soft dark:text-slate-300',
  primary: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cta: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
}

export function Badge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]} ${className}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function DemoBadge({ children = 'Démo' }) {
  return <Badge tone="warning" icon={FlaskConical}>{children}</Badge>
}

export function SponsoredBadge() {
  return <Badge tone="cta" icon={Megaphone}>Sponsorisé</Badge>
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400" title="Profil vérifié">
      <BadgeCheck size={16} aria-hidden="true" />
      <span className="sr-only">Profil vérifié</span>
    </span>
  )
}

export function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-night-line dark:bg-night-soft ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}

// Carte cliquable vers une page de détail
export function LinkCard({ to, className = '', children, ...props }) {
  return (
    <Link
      to={to}
      className={`block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary dark:border-night-line dark:bg-night-soft dark:hover:border-primary ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between first:mt-0">
      <h2 className="text-base font-bold text-night dark:text-white">{children}</h2>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center dark:border-night-line">
      {Icon && <Icon className="mx-auto mb-2 text-slate-400" size={28} aria-hidden="true" />}
      <p className="font-semibold text-night dark:text-white">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{children}</p>}
    </div>
  )
}

// Affiche la valeur, ou "Non renseigné" si elle vaut null
export function Field({ icon: Icon, label, value, children }) {
  const missing = children === undefined && (value === null || value === undefined)
  return (
    <div className={`relative min-w-0 py-2 ${Icon ? 'pl-8' : ''}`}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={18} className="absolute left-0 top-2.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />}
        {label}
      </dt>
      <dd className={`text-sm ${missing ? 'italic text-slate-500 dark:text-slate-400' : 'text-night dark:text-slate-100'}`}>
        {children ?? (missing ? NON_RENSEIGNE : value)}
      </dd>
    </div>
  )
}

export function Avatar({ user, size = 40 }) {
  if (!user) return null
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: user.avatar.couleur, fontSize: size * 0.36 }}
    >
      {user.avatar.initiales}
    </span>
  )
}

// Onglets segmentés (role="tablist")
export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="mb-4 flex gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-night-soft">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`min-h-tap flex-1 rounded-lg px-2 text-sm font-semibold transition-colors ${
            value === t.value
              ? 'bg-white text-night shadow-sm dark:bg-night dark:text-white'
              : 'text-slate-600 hover:text-night dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// Filtres en puces défilantes
export function Chips({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-tap shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
            value === o.value
              ? 'border-night bg-night text-white dark:border-primary dark:bg-primary dark:text-night'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-night-line dark:bg-night-soft dark:text-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Bandeau signalant une donnée fictive
export function DemoNotice({ children }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
      <FlaskConical size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

const inputCls =
  'w-full min-h-tap rounded-xl border border-slate-300 bg-white px-3 text-sm text-night placeholder:text-slate-400 dark:border-night-line dark:bg-night-soft dark:text-white'

export function FormField({ label, id, hint, children }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-night dark:text-slate-100">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export function Input(props) {
  return <input className={inputCls} {...props} />
}

export function Select({ options, ...props }) {
  return (
    <select className={inputCls} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Textarea(props) {
  return <textarea className={`${inputCls} py-2`} rows={4} {...props} />
}
