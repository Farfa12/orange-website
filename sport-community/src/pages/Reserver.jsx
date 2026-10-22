import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, DemoBadge, DemoNotice, EmptyState, FormField, Input } from '../components/ui.jsx'
import { formatPrice, todayISO } from '../lib/format.js'

const CRENEAUX = ['09:00', '10:30', '12:00', '14:00', '17:30', '19:00', '20:30']

export default function Reserver() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAssociation, prestationsDemo, computeServiceFee, bookingConfig, addBooking } = useApp()
  const structure = getAssociation(id)
  const [prestationId, setPrestationId] = useState(prestationsDemo[0].id)
  const [jour, setJour] = useState('')
  const [heure, setHeure] = useState('')

  if (!structure)
    return (
      <PageShell title="Réserver" back>
        <EmptyState title="Structure introuvable" />
      </PageShell>
    )

  const prestation = prestationsDemo.find((p) => p.id === prestationId)
  const frais = computeServiceFee(prestation.prix)
  const total = Math.round((prestation.prix + frais) * 100) / 100
  const valid = jour && heure

  const confirmer = () => {
    const bookingId = addBooking({ structureId: structure.id, prestation: prestation.libelle, date: `${jour}T${heure}`, prix: prestation.prix })
    navigate(`/reservations/${bookingId}`, { replace: true })
  }

  return (
    <PageShell title="Réserver" back>
      <p className="text-sm text-slate-600 dark:text-slate-400">Structure</p>
      <h2 className="mb-4 text-lg font-bold text-night dark:text-white">{structure.nom}</h2>
      <DemoNotice>
        Réservation simulée. Les prestations et prix ci-dessous sont des exemples de démonstration, pas les tarifs de la structure.
      </DemoNotice>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-semibold text-night dark:text-slate-100">Prestation</legend>
        <div className="space-y-2">
          {prestationsDemo.map((p) => (
            <label key={p.id}
              className={`flex min-h-tap cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                prestationId === p.id ? 'border-primary bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-300 dark:border-night-line'
              }`}>
              <input type="radio" name="prestation" value={p.id} checked={prestationId === p.id} onChange={() => setPrestationId(p.id)} className="h-5 w-5 accent-emerald-600" />
              <span className="flex-1 text-night dark:text-slate-100">{p.libelle}</span>
              <span className="font-semibold text-night dark:text-white">{formatPrice(p.prix)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Jour" id="jour">
        <Input id="jour" type="date" min={todayISO()} value={jour} onChange={(e) => setJour(e.target.value)} />
      </FormField>

      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-semibold text-night dark:text-slate-100">Créneau</legend>
        <div className="grid grid-cols-4 gap-2">
          {CRENEAUX.map((c) => (
            <button key={c} type="button" aria-pressed={heure === c} onClick={() => setHeure(c)}
              className={`min-h-tap rounded-xl border text-sm font-semibold ${
                heure === c ? 'border-night bg-night text-white dark:border-primary dark:bg-primary dark:text-night' : 'border-slate-300 text-night dark:border-night-line dark:text-slate-200'
              }`}>
              {c.replace(':', 'h')}
            </button>
          ))}
        </div>
      </fieldset>

      <Card>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-night dark:text-white">Récapitulatif</h3>
          <DemoBadge>Simulation</DemoBadge>
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600 dark:text-slate-400">{prestation.libelle}</dt><dd>{formatPrice(prestation.prix)}</dd></div>
          <div className="flex justify-between">
            <dt className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              Frais de service
              <span title={`${bookingConfig.pourcentage} % du prix, minimum ${formatPrice(bookingConfig.minimum)}, offerts sur les séances gratuites`}>
                <Info size={14} aria-hidden="true" />
              </span>
            </dt>
            <dd>{frais === 0 ? 'Offerts' : formatPrice(frais)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold dark:border-night-line">
            <dt>Total</dt><dd>{total === 0 ? 'Gratuit' : formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Frais de service : {bookingConfig.pourcentage} % du prix (minimum {formatPrice(bookingConfig.minimum)}), offerts sur les séances gratuites.
        </p>
      </Card>

      <Button variant="cta" full className="mt-4" disabled={!valid} onClick={confirmer}>
        Confirmer la réservation simulée
      </Button>
    </PageShell>
  )
}
