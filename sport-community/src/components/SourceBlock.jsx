import { ExternalLink, FlaskConical, Database } from 'lucide-react'
import { formatDate } from '../lib/format.js'
import { Button } from './ui.jsx'

// Provenance d'une donnée réelle : bouton "Voir la source" + date de collecte.
export default function SourceBlock({ item }) {
  if (item.demo) {
    return (
      <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
        <p className="flex items-center gap-2 font-semibold">
          <FlaskConical size={16} aria-hidden="true" /> Donnée de démonstration
        </p>
        <p className="mt-1">
          Cette fiche est fictive et sert uniquement à tester l'application. Elle sera remplacée par des données réelles et sourcées.
        </p>
      </div>
    )
  }
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-night-line dark:bg-night-soft">
      <p className="flex items-center gap-2 font-semibold text-night dark:text-white">
        <Database size={16} aria-hidden="true" /> Source : {item.source ?? 'Non renseignée'}
      </p>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Données collectées le {item.date_collecte ? formatDate(item.date_collecte, { weekday: false }) : 'Non renseigné'}
      </p>
      {item.source_url && (
        <Button variant="outline" href={item.source_url} className="mt-3" aria-label="Voir la source (ouvre un nouvel onglet)">
          Voir la source <ExternalLink size={16} aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
