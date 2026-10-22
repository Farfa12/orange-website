import { useParams } from 'react-router-dom'
import { CalendarDays, MapPin, Euro, Trophy, Globe, ExternalLink, Check, Plus } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import SourceBlock from '../components/SourceBlock.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Button, DemoBadge, EmptyState, Field } from '../components/ui.jsx'
import { formatDate, formatPrice, label } from '../lib/format.js'
import { TYPES_EVENEMENTS } from './Evenements.jsx'

export default function EvenementDetail() {
  const { id } = useParams()
  const { getEvent, isParticipating, toggleEventParticipation } = useApp()
  const e = getEvent(id)

  if (!e)
    return (
      <PageShell title="Événement" back>
        <EmptyState title="Événement introuvable" />
      </PageShell>
    )

  const going = isParticipating(e.id)

  return (
    <PageShell title="Événement" back>
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge tone="primary">{TYPES_EVENEMENTS[e.type] ?? label(e.type)}</Badge>
        {e.demo && <DemoBadge />}
      </div>
      <h2 className="text-xl font-bold text-night dark:text-white">{e.nom}</h2>

      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={CalendarDays} label="Date" value={formatDate(e.date)} />
        <Field icon={MapPin} label="Lieu" value={e.lieu} />
        <Field icon={MapPin} label="Ville" value={e.ville} />
        <Field icon={Trophy} label="Sport" value={e.sport ? label(e.sport) : null} />
        <Field icon={Euro} label="Tarif" value={e.tarif === null ? null : formatPrice(e.tarif)} />
        <Field icon={Globe} label="Site officiel" value={e.site_officiel}>
          {e.site_officiel ? (
            <a href={e.site_officiel} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline dark:text-emerald-400">
              {e.site_officiel}
            </a>
          ) : undefined}
        </Field>
      </dl>

      <div className="mt-4 space-y-2">
        {e.site_officiel && (
          <Button variant="cta" full href={e.site_officiel} aria-label="S'inscrire sur le site officiel (ouvre un nouvel onglet)">
            S'inscrire sur le site officiel <ExternalLink size={16} aria-hidden="true" />
          </Button>
        )}
        <Button variant={going ? 'outline' : e.site_officiel ? 'primary' : 'cta'} full onClick={() => toggleEventParticipation(e.id)} aria-pressed={going}>
          {going ? <><Check size={18} aria-hidden="true" /> Dans mes événements</> : <><Plus size={18} aria-hidden="true" /> J'y vais</>}
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          « J'y vais » l'ajoute à votre agenda dans l'app. L'inscription officielle se fait auprès de l'organisateur.
        </p>
      </div>

      <SourceBlock item={e} />
    </PageShell>
  )
}
