import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarDays, Building2, Ticket } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Button, Card, DemoBadge, EmptyState, Field } from '../components/ui.jsx'
import { formatDate, formatPrice, formatTime } from '../lib/format.js'
import { STATUTS_RESERVATION, bookingStatus } from './Reservations.jsx'

export default function ReservationDetail() {
  const { id } = useParams()
  const { getBooking, getAssociation, cancelBooking } = useApp()
  const b = getBooking(id)

  if (!b)
    return (
      <PageShell title="Réservation" back>
        <EmptyState title="Réservation introuvable" />
      </PageShell>
    )

  const structure = getAssociation(b.structureId)
  const statut = bookingStatus(b)
  const s = STATUTS_RESERVATION[statut]

  return (
    <PageShell title="Réservation" back>
      <Card className="text-center">
        <div className="mb-3 flex justify-center gap-1">
          <Badge tone={s.tone}>{s.label}</Badge>
          <DemoBadge>Réservation simulée</DemoBadge>
        </div>
        {statut === 'confirmee' ? (
          <div className="mx-auto w-fit rounded-xl bg-white p-3">
            <QRCodeSVG value={b.qr} size={168} aria-label="QR code de la réservation (démonstration)" />
          </div>
        ) : (
          <Ticket size={48} className="mx-auto text-slate-400" aria-hidden="true" />
        )}
        <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">{b.qr}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">QR code de démonstration, non valable sur place.</p>
      </Card>

      <dl className="mt-4 divide-y divide-slate-100 dark:divide-night-line">
        <Field icon={Building2} label="Structure" value={structure?.nom ?? 'Structure indisponible'} />
        <Field icon={Ticket} label="Prestation" value={b.prestation} />
        <Field icon={CalendarDays} label="Date" value={`${formatDate(b.date)}${formatTime(b.date) ? ` à ${formatTime(b.date)}` : ''}`} />
      </dl>

      <Card className="mt-4">
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-slate-600 dark:text-slate-400">Prix</dt><dd>{formatPrice(b.prix)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-600 dark:text-slate-400">Frais de service</dt><dd>{b.fraisService === 0 ? 'Offerts' : formatPrice(b.fraisService)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-bold dark:border-night-line"><dt>Total</dt><dd>{formatPrice(b.total)}</dd></div>
        </dl>
      </Card>

      {statut === 'confirmee' && (
        <Button variant="danger" full className="mt-4"
          onClick={() => window.confirm('Annuler cette réservation simulée ?') && cancelBooking(b.id)}>
          Annuler la réservation
        </Button>
      )}
    </PageShell>
  )
}
