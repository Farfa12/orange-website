import { Link } from 'react-router-dom'
import { CalendarCheck, ChevronRight, Info, Megaphone, Moon, RotateCcw, Sun, Ticket, Users, Building2, MapPin, CalendarHeart } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { Avatar, Badge, Button, Card, DemoBadge, SectionTitle, VerifiedBadge } from '../components/ui.jsx'
import { formatDate, label } from '../lib/format.js'
import { AnnouncementCard } from './Communaute.jsx'

function MenuLink({ to, icon: Icon, children, count }) {
  return (
    <li>
      <Link to={to} className="flex min-h-tap items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-night">
        <Icon size={20} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium text-night dark:text-slate-100">{children}</span>
        {count !== undefined && <Badge>{count}</Badge>}
        <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
      </Link>
    </li>
  )
}

export default function Profil() {
  const { currentUser: u, myGroups, myAnnouncements, myBookings, myPasses, eventParticipations, resetDemo } = useApp()
  const { theme, toggleTheme } = useTheme()

  const reset = () => {
    if (window.confirm('Réinitialiser la démo ? Vos annonces, groupes, messages et réservations créés seront effacés.')) resetDemo()
  }

  return (
    <PageShell title="Mon profil" back>
      <div className="flex flex-col items-center text-center">
        <Avatar user={u} size={80} />
        <h2 className="mt-3 flex items-center gap-1 text-xl font-bold text-night dark:text-white">
          {u.prenom} {u.nom} {u.verifie && <VerifiedBadge />}
        </h2>
        <p className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <MapPin size={14} aria-hidden="true" /> {u.ville} · {u.statut}
        </p>
        <div className="mt-2"><DemoBadge>Profil fictif</DemoBadge></div>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{u.bio}</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-1" aria-label="Mes sports">
          {u.sports.map((s) => (
            <li key={s.sport}><Badge tone="primary">{label(s.sport)} · {s.niveau}</Badge></li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Membre depuis le {formatDate(u.membreDepuis, { weekday: false })}</p>
      </div>

      <SectionTitle>Mon activité</SectionTitle>
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-slate-100 dark:divide-night-line">
          <MenuLink to="/communaute?onglet=groupes" icon={Users} count={myGroups.length}>Mes groupes</MenuLink>
          <MenuLink to="/reservations" icon={CalendarCheck} count={myBookings.length}>Mes réservations</MenuLink>
          <MenuLink to="/pass" icon={Ticket} count={myPasses.length}>Mes pass</MenuLink>
          <MenuLink to="/evenements" icon={CalendarHeart} count={eventParticipations.length}>Événements où je vais</MenuLink>
        </ul>
      </Card>

      <SectionTitle>Mes annonces</SectionTitle>
      {myAnnouncements.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Vous n'avez publié aucune annonce.</p>
      ) : (
        <ul className="space-y-3">
          {myAnnouncements.map((a) => <li key={a.id}><AnnouncementCard annonce={a} /></li>)}
        </ul>
      )}
      <Button variant="outline" to="/communaute/annonces/nouvelle" full className="mt-3">
        <Megaphone size={18} aria-hidden="true" /> Publier une annonce
      </Button>

      <SectionTitle>Réglages</SectionTitle>
      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-slate-100 dark:divide-night-line">
          <li>
            <button type="button" onClick={toggleTheme} className="flex min-h-tap w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-night">
              {theme === 'dark' ? <Sun size={20} className="text-slate-400" aria-hidden="true" /> : <Moon size={20} className="text-slate-500" aria-hidden="true" />}
              <span className="flex-1 text-sm font-medium text-night dark:text-slate-100">Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
            </button>
          </li>
          <MenuLink to="/pros" icon={Building2}>Espace Associations & Pros</MenuLink>
          <MenuLink to="/profil/a-propos" icon={Info}>À propos</MenuLink>
          <li>
            <button type="button" onClick={reset} className="flex min-h-tap w-full items-center gap-3 px-4 py-3 text-left text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950">
              <RotateCcw size={20} aria-hidden="true" />
              <span className="flex-1 text-sm font-medium">Réinitialiser la démo</span>
            </button>
          </li>
        </ul>
      </Card>
    </PageShell>
  )
}
