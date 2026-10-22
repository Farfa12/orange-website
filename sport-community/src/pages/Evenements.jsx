import { useState } from 'react'
import { CalendarDays, MapPin, Euro, CalendarX } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Chips, DemoBadge, EmptyState, LinkCard } from '../components/ui.jsx'
import { VILLES, formatDate, formatPrice, isPast, label } from '../lib/format.js'

export const TYPES_EVENEMENTS = {
  course: 'Course',
  trail: 'Trail',
  cyclosportive: 'Cyclosportive',
  tournoi: 'Tournoi',
  initiation: 'Initiation',
  stage: 'Stage vacances',
}

export default function Evenements() {
  const { events, isParticipating } = useApp()
  const [ville, setVille] = useState('toutes')
  const [type, setType] = useState('tous')

  const list = events
    .filter((e) => !isPast(e.date))
    .filter((e) => ville === 'toutes' || e.ville === ville)
    .filter((e) => type === 'tous' || e.type === type)
    .sort((a, b) => a.date.localeCompare(b.date))
  const reels = events.filter((e) => !e.demo).length

  return (
    <PageShell title="Événements">
      {reels === 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          Aucun événement réel n'a encore été collecté. Les fiches marquées « Démo » servent uniquement à tester l'affichage.
        </p>
      )}
      <Chips label="Filtrer par ville" value={ville} onChange={setVille}
        options={[{ value: 'toutes', label: 'Toutes les villes' }, ...VILLES.map((v) => ({ value: v, label: v }))]} />
      <Chips label="Filtrer par type" value={type} onChange={setType}
        options={[{ value: 'tous', label: 'Tous les types' }, ...Object.entries(TYPES_EVENEMENTS).map(([value, l]) => ({ value, label: l }))]} />

      {list.length === 0 ? (
        <EmptyState icon={CalendarX} title="Aucun événement à venir">Essayez une autre ville ou un autre type.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <li key={e.id}>
              <LinkCard to={`/evenements/${e.id}`}>
                <div className="mb-1 flex flex-wrap gap-1">
                  <Badge tone="primary">{TYPES_EVENEMENTS[e.type] ?? label(e.type)}</Badge>
                  {e.sport && <Badge>{label(e.sport)}</Badge>}
                  {e.demo && <DemoBadge />}
                  {isParticipating(e.id) && <Badge tone="info">J'y vais</Badge>}
                </div>
                <p className="font-bold text-night dark:text-white">{e.nom}</p>
                <div className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-1"><CalendarDays size={12} aria-hidden="true" /> {formatDate(e.date)}</p>
                  <p className="flex items-center gap-1"><MapPin size={12} aria-hidden="true" /> {e.lieu ? `${e.lieu}, ${e.ville}` : e.ville}</p>
                  <p className="flex items-center gap-1"><Euro size={12} aria-hidden="true" /> {e.tarif === null ? 'Tarif non renseigné' : formatPrice(e.tarif)}</p>
                </div>
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
