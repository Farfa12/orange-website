import { CalendarCheck, ChevronRight } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, DemoNotice, EmptyState, LinkCard, SectionTitle } from '../components/ui.jsx'
import { formatDateTime, formatPrice, isPast } from '../lib/format.js'

export const STATUTS_RESERVATION = {
  confirmee: { label: 'Confirmée', tone: 'primary' },
  passee: { label: 'Passée', tone: 'neutral' },
  annulee: { label: 'Annulée', tone: 'neutral' },
}

export function bookingStatus(b) {
  return b.statut === 'confirmee' && isPast(b.date) ? 'passee' : b.statut
}

function BookingList({ list }) {
  const { getAssociation } = useApp()
  return (
    <ul className="space-y-2">
      {list.map((b) => {
        const s = STATUTS_RESERVATION[bookingStatus(b)]
        return (
          <li key={b.id}>
            <LinkCard to={`/reservations/${b.id}`} className="flex items-center gap-3 p-3">
              <CalendarCheck size={20} className="shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-night dark:text-white">{getAssociation(b.structureId)?.nom ?? 'Structure indisponible'}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{b.prestation} · {formatDateTime(b.date)} · {formatPrice(b.total)}</p>
              </div>
              <Badge tone={s.tone}>{s.label}</Badge>
              <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
            </LinkCard>
          </li>
        )
      })}
    </ul>
  )
}

export default function Reservations() {
  const { myBookings } = useApp()
  const aVenir = myBookings.filter((b) => bookingStatus(b) === 'confirmee')
  const autres = myBookings.filter((b) => bookingStatus(b) !== 'confirmee').reverse()
  return (
    <PageShell title="Mes réservations" back>
      <DemoNotice>Réservations simulées : aucune n'a été transmise à une structure.</DemoNotice>
      <SectionTitle>À venir</SectionTitle>
      {aVenir.length ? <BookingList list={aVenir} /> : <EmptyState icon={CalendarCheck} title="Aucune réservation à venir" />}
      {autres.length > 0 && (
        <>
          <SectionTitle>Historique</SectionTitle>
          <BookingList list={autres} />
        </>
      )}
    </PageShell>
  )
}
