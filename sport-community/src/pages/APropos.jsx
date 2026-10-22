import { FlaskConical, Database, GraduationCap } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Card, SectionTitle } from '../components/ui.jsx'

export default function APropos() {
  const { associations, equipements, events } = useApp()
  const reels = (l) => l.filter((x) => !x.demo).length

  return (
    <PageShell title="À propos" back>
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/60">
        <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
          <FlaskConical size={18} aria-hidden="true" /> Prototype scolaire
        </p>
        <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
          Prototype scolaire : annonces, utilisateurs, offres et réservations fictifs.
        </p>
      </Card>

      <SectionTitle>Le projet</SectionTitle>
      <p className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
        <GraduationCap size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        Sport Community est un prototype réalisé dans le cadre d'une SAÉ Mini-entreprise (BUT Techniques de commercialisation, 2e année).
        Une seule carte pour les avantages sportifs locaux, et une communauté de particuliers pour trouver partenaires, groupes et bons plans.
      </p>

      <SectionTitle>Données</SectionTitle>
      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        <li>
          <strong>Données réelles</strong> (structures, équipements, événements) : publiques, sourcées, avec lien vers la source et date de collecte.
          Une information introuvable est affichée « Non renseigné ».
        </li>
        <li>
          Collectées à ce jour : {reels(associations)} structure(s), {reels(equipements)} équipement(s), {reels(events)} événement(s).
          Les fiches marquées « Démo » sont fictives.
        </li>
        <li>
          <strong>Données fictives</strong> : membres, messages, annonces, groupes, offres sponsors, pass et réservations.
          Les marques des offres sont inventées. Aucun paiement ni aucune réservation ne sont réellement effectués.
        </li>
      </ul>

      <SectionTitle>Crédits</SectionTitle>
      <p className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
        <Database size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          © OpenStreetMap contributors. Données disponibles sous licence ODbL :{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline dark:text-emerald-400">
            openstreetmap.org/copyright
          </a>
        </span>
      </p>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
        Icônes : Lucide (licence ISC).
      </p>
      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">Version prototype 0.2</p>
    </PageShell>
  )
}
