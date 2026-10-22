import { useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, MapPin, MessageCircle, Trophy, CheckCircle2, Trash2 } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Avatar, Badge, Button, Card, DemoBadge, EmptyState, Field, VerifiedBadge } from '../components/ui.jsx'
import { CATEGORIES_ANNONCES, STATUTS_ANNONCES, formatDate, formatTime, label } from '../lib/format.js'

export default function AnnonceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAnnouncement, getUser, currentUserId, startConversation, setAnnouncementStatus, deleteAnnouncement } = useApp()
  const annonce = getAnnouncement(id)

  if (!annonce)
    return (
      <PageShell title="Annonce" back>
        <EmptyState title="Annonce introuvable">Elle a peut-être été supprimée.</EmptyState>
      </PageShell>
    )

  const auteur = getUser(annonce.auteurId)
  const isMine = annonce.auteurId === currentUserId
  const heure = formatTime(annonce.date)

  const contacter = () => navigate(`/communaute/messages/${startConversation(auteur.id)}`)
  const supprimer = () => {
    if (window.confirm('Supprimer définitivement cette annonce ?')) {
      deleteAnnouncement(annonce.id)
      navigate('/communaute?onglet=annonces', { replace: true })
    }
  }

  return (
    <PageShell title="Annonce" back>
      {annonce.photo && (
        <img src={annonce.photo} alt="" className="mb-4 aspect-[5/3] w-full rounded-2xl object-cover" />
      )}
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge tone="primary">{CATEGORIES_ANNONCES[annonce.categorie]}</Badge>
        <Badge>{STATUTS_ANNONCES[annonce.statut]}</Badge>
        <DemoBadge>Annonce fictive</DemoBadge>
      </div>
      <h2 className="text-xl font-bold text-night dark:text-white">{annonce.titre}</h2>
      <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300">{annonce.description}</p>

      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={Trophy} label="Sport" value={label(annonce.sport)} />
        <Field icon={MapPin} label="Ville" value={annonce.lieu} />
        <Field icon={CalendarDays} label="Date" value={`${formatDate(annonce.date)}${heure ? ` à ${heure}` : ''}`} />
      </dl>

      <Card className="mt-4 flex items-center gap-3">
        <Avatar user={auteur} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-semibold text-night dark:text-white">
            {auteur.prenom} {auteur.nom} {auteur.verifie && <VerifiedBadge />}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{auteur.statut} · {auteur.ville}</p>
          {!auteur.verifie && <p className="text-xs text-slate-500 dark:text-slate-400">Profil non vérifié</p>}
        </div>
      </Card>

      <div className="mt-4 space-y-2">
        {isMine ? (
          <>
            {annonce.statut === 'active' && (
              <Button variant="primary" full onClick={() => setAnnouncementStatus(annonce.id, 'pourvue')}>
                <CheckCircle2 size={18} aria-hidden="true" /> Marquer comme pourvue
              </Button>
            )}
            <Button variant="danger" full onClick={supprimer}>
              <Trash2 size={18} aria-hidden="true" /> Supprimer l'annonce
            </Button>
          </>
        ) : (
          <Button variant="cta" full onClick={contacter} disabled={annonce.statut !== 'active'}>
            <MessageCircle size={18} aria-hidden="true" />
            {annonce.statut === 'active' ? `Contacter ${auteur.prenom}` : 'Annonce plus disponible'}
          </Button>
        )}
      </div>
    </PageShell>
  )
}
