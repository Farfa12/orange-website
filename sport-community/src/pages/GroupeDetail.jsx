import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Lock, MapPin, MessageCircle, Trophy, Users, Gauge, LogOut, UserPlus, Clock } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Avatar, Badge, Button, Card, DemoBadge, EmptyState, Field, SectionTitle, VerifiedBadge } from '../components/ui.jsx'
import { formatDate, formatTime, label } from '../lib/format.js'

export default function GroupeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getGroup, getUser, currentUserId, conversations, joinGroup, leaveGroup, requestJoinGroup, joinRequests } = useApp()
  const groupe = getGroup(id)

  if (!groupe)
    return (
      <PageShell title="Groupe" back>
        <EmptyState title="Groupe introuvable" />
      </PageShell>
    )

  const isMember = groupe.membres.includes(currentUserId)
  const isAdmin = groupe.adminId === currentUserId
  const isPrivate = groupe.visibilite === 'privé'
  const pending = joinRequests.includes(groupe.id)
  const admin = getUser(groupe.adminId)
  const conversation = conversations.find((c) => c.groupId === groupe.id)
  const sortie = groupe.prochaineSortie

  return (
    <PageShell title="Groupe" back>
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge tone="primary">{label(groupe.sport)}</Badge>
        {isPrivate ? <Badge icon={Lock}>Privé</Badge> : <Badge>Public</Badge>}
        <DemoBadge>Groupe fictif</DemoBadge>
      </div>
      <h2 className="text-xl font-bold text-night dark:text-white">{groupe.nom}</h2>
      <p className="mt-2 text-slate-700 dark:text-slate-300">{groupe.description}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Groupe créé par un membre de la communauté. Il n'est rattaché à aucun club.
      </p>

      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={MapPin} label="Ville" value={groupe.ville} />
        <Field icon={Gauge} label="Niveau" value={label(groupe.niveau)} />
        <Field icon={Users} label="Membres" value={`${groupe.nbMembres} membres`} />
        <Field icon={Trophy} label="Sport" value={label(groupe.sport)} />
      </dl>

      {sortie && (
        <Card className="mt-4 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            <CalendarDays size={14} aria-hidden="true" /> Prochaine sortie
          </p>
          <p className="mt-1 font-semibold text-night dark:text-white">{sortie.intitule}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {formatDate(sortie.date)}{formatTime(sortie.date) ? ` à ${formatTime(sortie.date)}` : ''}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{sortie.lieu}</p>
        </Card>
      )}

      <SectionTitle>Animé par</SectionTitle>
      <Card className="flex items-center gap-3">
        <Avatar user={admin} size={44} />
        <div>
          <p className="flex items-center gap-1 font-semibold text-night dark:text-white">
            {admin.prenom} {admin.nom} {admin.verifie && <VerifiedBadge />}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{admin.statut}</p>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {isMember ? (
          <>
            {conversation && (
              <Button variant="primary" full onClick={() => navigate(`/communaute/messages/${conversation.id}`)}>
                <MessageCircle size={18} aria-hidden="true" /> Discussion du groupe
              </Button>
            )}
            {!isAdmin && (
              <Button variant="outline" full onClick={() => leaveGroup(groupe.id)}>
                <LogOut size={18} aria-hidden="true" /> Quitter le groupe
              </Button>
            )}
          </>
        ) : isPrivate ? (
          <Button variant="cta" full disabled={pending} onClick={() => requestJoinGroup(groupe.id)}>
            {pending ? <><Clock size={18} aria-hidden="true" /> Demande envoyée (simulée)</> : <><UserPlus size={18} aria-hidden="true" /> Demander à rejoindre</>}
          </Button>
        ) : (
          <Button variant="cta" full onClick={() => joinGroup(groupe.id)}>
            <UserPlus size={18} aria-hidden="true" /> Rejoindre le groupe
          </Button>
        )}
      </div>
    </PageShell>
  )
}
