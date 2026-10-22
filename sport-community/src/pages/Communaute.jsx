import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, Users, MessageCircle, Plus, Lock, Sparkles, CalendarDays, Megaphone } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Avatar, Badge, Button, Chips, DemoNotice, EmptyState, LinkCard, Tabs, VerifiedBadge } from '../components/ui.jsx'
import { CATEGORIES_ANNONCES, STATUTS_ANNONCES, VILLES, formatDateTime, label } from '../lib/format.js'

const STATUT_TONES = { active: 'primary', pourvue: 'info', expiree: 'neutral' }

export function AnnouncementCard({ annonce }) {
  const { getUser } = useApp()
  const auteur = getUser(annonce.auteurId)
  return (
    <LinkCard to={`/communaute/annonces/${annonce.id}`}>
      <div className="mb-2 flex flex-wrap items-center gap-1">
        <Badge tone="primary">{CATEGORIES_ANNONCES[annonce.categorie]}</Badge>
        <Badge tone={STATUT_TONES[annonce.statut]}>{STATUTS_ANNONCES[annonce.statut]}</Badge>
        <Badge>{label(annonce.sport)}</Badge>
      </div>
      <p className="font-bold text-night dark:text-white">{annonce.titre}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{annonce.description}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Avatar user={auteur} size={24} />
        <span className="font-medium text-night dark:text-slate-200">{auteur?.prenom} {auteur?.nom?.charAt(0)}.</span>
        {auteur?.verifie && <VerifiedBadge />}
        <span aria-hidden="true">·</span>
        <MapPin size={12} aria-hidden="true" /> {annonce.lieu}
        <span aria-hidden="true">·</span>
        {formatDateTime(annonce.date)}
      </div>
    </LinkCard>
  )
}

function Annonces() {
  const { announcements } = useApp()
  const [categorie, setCategorie] = useState('toutes')
  const [ville, setVille] = useState('toutes')
  const list = announcements
    .filter((a) => categorie === 'toutes' || a.categorie === categorie)
    .filter((a) => ville === 'toutes' || a.lieu === ville)
    // Actives d'abord, puis par date de publication
    .sort((a, b) => (a.statut === 'active' ? 0 : 1) - (b.statut === 'active' ? 0 : 1) || b.creeLe.localeCompare(a.creeLe))

  return (
    <>
      <Chips
        label="Filtrer par catégorie"
        value={categorie}
        onChange={setCategorie}
        options={[{ value: 'toutes', label: 'Toutes' }, ...Object.entries(CATEGORIES_ANNONCES).map(([value, l]) => ({ value, label: l }))]}
      />
      <Chips
        label="Filtrer par ville"
        value={ville}
        onChange={setVille}
        options={[{ value: 'toutes', label: 'Toutes les villes' }, ...VILLES.map((v) => ({ value: v, label: v }))]}
      />
      <Button variant="cta" to="/communaute/annonces/nouvelle" full className="mb-3">
        <Plus size={18} aria-hidden="true" /> Publier une annonce
      </Button>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-orange-300 p-3 text-sm dark:border-orange-800">
        <Sparkles size={18} className="shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        <span className="flex-1 text-slate-700 dark:text-slate-300">Annonce mise en avant</span>
        <Badge tone="cta">Bientôt disponible</Badge>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="Aucune annonce pour ces filtres" />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}><AnnouncementCard annonce={a} /></li>
          ))}
        </ul>
      )}
    </>
  )
}

function Groupes() {
  const { groups, currentUserId } = useApp()
  const [ville, setVille] = useState('toutes')
  const list = groups.filter((g) => ville === 'toutes' || g.ville === ville)
  return (
    <>
      <Chips
        label="Filtrer par ville"
        value={ville}
        onChange={setVille}
        options={[{ value: 'toutes', label: 'Toutes les villes' }, ...VILLES.map((v) => ({ value: v, label: v }))]}
      />
      <Button variant="primary" to="/communaute/groupes/nouveau" full className="mb-4">
        <Plus size={18} aria-hidden="true" /> Créer un groupe
      </Button>
      {list.length === 0 ? (
        <EmptyState icon={Users} title="Aucun groupe dans cette ville">Lancez le premier !</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((g) => (
            <li key={g.id}>
              <LinkCard to={`/communaute/groupes/${g.id}`}>
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <Badge tone="primary">{label(g.sport)}</Badge>
                  <Badge>{label(g.niveau)}</Badge>
                  {g.visibilite === 'privé' && <Badge icon={Lock}>Privé</Badge>}
                  {g.membres.includes(currentUserId) && <Badge tone="info">Membre</Badge>}
                </div>
                <p className="font-bold text-night dark:text-white">{g.nom}</p>
                <p className="mt-1 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={12} aria-hidden="true" /> {g.ville}</span>
                  <span className="flex items-center gap-1"><Users size={12} aria-hidden="true" /> {g.nbMembres} membres</span>
                </p>
                {g.prochaineSortie && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CalendarDays size={12} aria-hidden="true" /> {formatDateTime(g.prochaineSortie.date)} · {g.prochaineSortie.intitule}
                  </p>
                )}
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Messages() {
  const { myConversations, getUser, getGroup, currentUserId } = useApp()
  if (myConversations.length === 0)
    return <EmptyState icon={MessageCircle} title="Aucune conversation">Contactez l'auteur d'une annonce ou rejoignez un groupe.</EmptyState>
  return (
    <ul className="space-y-2">
      {myConversations.map((c) => {
        const other = c.type === 'prive' ? getUser(c.participants.find((p) => p !== currentUserId)) : null
        const titre = c.type === 'groupe' ? getGroup(c.groupId)?.nom ?? c.titre : `${other?.prenom} ${other?.nom}`
        const last = c.messages.at(-1)
        return (
          <li key={c.id}>
            <LinkCard to={`/communaute/messages/${c.id}`} className="flex items-center gap-3 p-3">
              {other ? (
                <Avatar user={other} size={44} />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Users size={20} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-night dark:text-white">{titre}</p>
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                  {last ? `${last.auteurId === currentUserId ? 'Vous : ' : ''}${last.texte}` : 'Aucun message'}
                </p>
              </div>
              {last && <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(last.date)}</span>}
            </LinkCard>
          </li>
        )
      })}
    </ul>
  )
}

const ONGLETS = [
  { value: 'annonces', label: 'Annonces' },
  { value: 'groupes', label: 'Groupes' },
  { value: 'messages', label: 'Messages' },
]

export default function Communaute() {
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some((o) => o.value === params.get('onglet')) ? params.get('onglet') : 'annonces'
  return (
    <PageShell title="Communauté">
      <Tabs label="Sections de la communauté" tabs={ONGLETS} value={onglet} onChange={(v) => setParams({ onglet: v }, { replace: true })} />
      <DemoNotice>Prototype : les membres, annonces, groupes et messages sont fictifs.</DemoNotice>
      {onglet === 'annonces' && <Annonces />}
      {onglet === 'groupes' && <Groupes />}
      {onglet === 'messages' && <Messages />}
    </PageShell>
  )
}
