import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, MapPin, Search, Landmark, ChevronRight } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Chips, DemoBadge, EmptyState, LinkCard, Tabs } from '../components/ui.jsx'
import { VILLES, label } from '../lib/format.js'
import { PassContent } from './Pass.jsx'

const ONGLETS = [
  { value: 'structures', label: 'Structures' },
  { value: 'equipements', label: 'Équipements' },
  { value: 'pass', label: 'Pass' },
]

const normalize = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function DataNotice({ count }) {
  if (count > 0) return null
  return (
    <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
      Aucune donnée réelle collectée pour l'instant. Les fiches marquées « Démo » servent uniquement à tester l'affichage.
    </p>
  )
}

function Structures({ query, ville }) {
  const { associations } = useApp()
  const list = associations
    .filter((a) => ville === 'toutes' || a.ville === ville)
    .filter((a) => !query || normalize(`${a.nom} ${a.sport} ${a.ville}`).includes(normalize(query)))
  return (
    <>
      <DataNotice count={associations.filter((a) => !a.demo).length} />
      {list.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune structure trouvée" />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}>
              <LinkCard to={`/explorer/structures/${a.id}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Building2 size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-night dark:text-white">{a.nom}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin size={12} aria-hidden="true" /> {a.ville} · {label(a.sport)}
                  </p>
                  {a.demo && <div className="mt-1"><DemoBadge /></div>}
                </div>
                <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function Equipements({ query, ville }) {
  const { equipements } = useApp()
  const list = equipements
    .filter((e) => ville === 'toutes' || e.commune === ville)
    .filter((e) => !query || normalize(`${e.nom} ${e.type} ${e.commune}`).includes(normalize(query)))
  return (
    <>
      <DataNotice count={equipements.filter((e) => !e.demo).length} />
      {list.length === 0 ? (
        <EmptyState icon={Landmark} title="Aucun équipement trouvé" />
      ) : (
        <ul className="space-y-3">
          {list.map((e) => (
            <li key={e.id}>
              <LinkCard to={`/explorer/equipements/${e.id}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  <Landmark size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-night dark:text-white">{e.nom}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{e.type} · {e.commune}</p>
                  <div className="mt-1 flex gap-1">
                    <Badge tone="info">Équipement public</Badge>
                    {e.demo && <DemoBadge />}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default function Explorer() {
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some((o) => o.value === params.get('onglet')) ? params.get('onglet') : 'structures'
  const [query, setQuery] = useState('')
  const [ville, setVille] = useState('toutes')

  return (
    <PageShell title="Explorer & Réserver">
      <Tabs label="Que cherchez-vous ?" tabs={ONGLETS} value={onglet} onChange={(v) => setParams({ onglet: v }, { replace: true })} />
      {onglet === 'pass' ? (
        <PassContent />
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="recherche" className="sr-only">Rechercher</label>
            <input
              id="recherche"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={onglet === 'structures' ? 'Club, salle, sport…' : 'Piscine, stade, gymnase…'}
              className="min-h-tap w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-night dark:border-night-line dark:bg-night-soft dark:text-white"
            />
          </div>
          <Chips label="Filtrer par ville" value={ville} onChange={setVille}
            options={[{ value: 'toutes', label: 'Toutes les villes' }, ...VILLES.map((v) => ({ value: v, label: v }))]} />
          {onglet === 'structures' ? <Structures query={query} ville={ville} /> : <Equipements query={query} ville={ville} />}
        </>
      )}
    </PageShell>
  )
}
