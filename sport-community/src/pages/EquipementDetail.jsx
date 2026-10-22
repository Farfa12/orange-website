import { useParams } from 'react-router-dom'
import { MapPin, Landmark } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import SourceBlock from '../components/SourceBlock.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, DemoBadge, EmptyState, Field } from '../components/ui.jsx'

export default function EquipementDetail() {
  const { id } = useParams()
  const { getEquipement } = useApp()
  const e = getEquipement(id)

  if (!e)
    return (
      <PageShell title="Équipement" back>
        <EmptyState title="Équipement introuvable" />
      </PageShell>
    )

  return (
    <PageShell title="Équipement" back>
      <div className="mb-2 flex flex-wrap gap-1">
        <Badge tone="info">Équipement public</Badge>
        {e.demo && <DemoBadge />}
      </div>
      <h2 className="text-xl font-bold text-night dark:text-white">{e.nom}</h2>
      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={Landmark} label="Type" value={e.type} />
        <Field icon={MapPin} label="Adresse" value={e.adresse} />
        <Field icon={MapPin} label="Commune" value={e.commune} />
      </dl>
      <SourceBlock item={e} />
    </PageShell>
  )
}
