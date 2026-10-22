import { useParams } from 'react-router-dom'
import { MapPin, Phone, Globe, Clock, Euro, Trophy, MessageSquareQuote, CalendarPlus } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import SourceBlock from '../components/SourceBlock.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Button, Card, DemoBadge, EmptyState, Field, SectionTitle } from '../components/ui.jsx'
import { formatPrice, label } from '../lib/format.js'

// Les horaires/tarifs collectés peuvent être une chaîne ou une liste
function ListOrText({ value, render = (x) => x }) {
  if (Array.isArray(value))
    return (
      <ul className="space-y-0.5">
        {value.map((v, i) => <li key={i}>{render(v)}</li>)}
      </ul>
    )
  return render(value)
}

const renderTarif = (t) => (typeof t === 'object' && t !== null ? `${t.libelle} : ${formatPrice(t.prix)}` : t)

export default function StructureDetail() {
  const { id } = useParams()
  const { getAssociation } = useApp()
  const a = getAssociation(id)

  if (!a)
    return (
      <PageShell title="Structure" back>
        <EmptyState title="Structure introuvable" />
      </PageShell>
    )

  return (
    <PageShell title="Structure" back>
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge tone="primary">{label(a.sport)}</Badge>
        {a.demo && <DemoBadge />}
      </div>
      <h2 className="text-xl font-bold text-night dark:text-white">{a.nom}</h2>

      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={MapPin} label="Adresse" value={a.adresse} />
        <Field icon={MapPin} label="Ville" value={a.ville} />
        <Field icon={Trophy} label="Sport" value={label(a.sport)} />
        <Field icon={Phone} label="Téléphone" value={a.telephone}>
          {a.telephone ? <a href={`tel:${a.telephone.replace(/\s/g, '')}`} className="text-emerald-700 underline dark:text-emerald-400">{a.telephone}</a> : undefined}
        </Field>
        <Field icon={Globe} label="Site web" value={a.site_web}>
          {a.site_web ? (
            <a href={a.site_web} target="_blank" rel="noopener noreferrer" className="break-all text-emerald-700 underline dark:text-emerald-400">{a.site_web}</a>
          ) : undefined}
        </Field>
        <Field icon={Clock} label="Horaires" value={a.horaires}>
          {a.horaires ? <ListOrText value={a.horaires} /> : undefined}
        </Field>
        <Field icon={Euro} label="Tarifs" value={a.tarifs}>
          {a.tarifs ? <ListOrText value={a.tarifs} render={renderTarif} /> : undefined}
        </Field>
      </dl>

      <SectionTitle>Avis</SectionTitle>
      <Card className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <MessageSquareQuote size={20} aria-hidden="true" /> Pas encore d'avis
      </Card>

      <div className="mt-6">
        <Button variant="cta" full to={`/explorer/reserver/${a.id}`}>
          <CalendarPlus size={18} aria-hidden="true" /> Réserver un créneau
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Réservation simulée : aucun paiement, aucune réservation transmise à la structure.
        </p>
      </div>

      <SourceBlock item={a} />
    </PageShell>
  )
}
