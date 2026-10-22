import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarCheck, ChevronRight, PiggyBank, Star, Ticket, Building2, Check, Copy } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Button, Card, DemoBadge, EmptyState, LinkCard, SectionTitle, SponsoredBadge } from '../components/ui.jsx'
import { formatDate, formatDateTime, formatEuros, formatPrice, isPast, label } from '../lib/format.js'

function MemberCard({ user }) {
  const { carte } = user
  return (
    <section
      aria-label="Ma carte Sport Community"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night via-night-soft to-emerald-800 p-5 text-white shadow-lg"
    >
      <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Sport Community</p>
          <p className="mt-1 text-lg font-bold">{user.prenom} {user.nom}</p>
          <p className="text-sm text-slate-300">{carte.formule}</p>
          <p className="mt-4 font-mono text-sm tracking-wider">{carte.numero}</p>
          <p className="text-xs text-slate-400">Valable jusqu'au {formatDate(carte.validite, { weekday: false })}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-white p-2">
          <QRCodeSVG value={carte.numero} size={88} aria-label={`QR code de la carte ${carte.numero}`} />
        </div>
      </div>
      <p className="relative mt-4 inline-flex rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-semibold text-amber-950">
        Carte fictive (prototype)
      </p>
    </section>
  )
}

function OfferCard({ offer }) {
  const { isOfferUsed, redeemOffer } = useApp()
  const used = isOfferUsed(offer.id)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.code)
      setCopied(true)
    } catch {
      // presse-papiers indisponible : le code reste affiché
    }
  }

  return (
    <Card className="w-72 shrink-0 snap-start">
      <div className="mb-2 flex flex-wrap gap-1">
        <SponsoredBadge />
        <DemoBadge>Offre fictive (démo)</DemoBadge>
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{offer.marque} · {offer.ville}</p>
      <p className="mt-1 font-bold text-night dark:text-white">{offer.titre}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{offer.description}</p>
      <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        Jusqu'à {formatPrice(offer.economie)} d'économie
      </p>
      {used ? (
        <div className="mt-3 rounded-xl bg-slate-100 p-3 dark:bg-night">
          <p className="text-xs text-slate-600 dark:text-slate-400">Code à présenter :</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-night dark:text-white">{offer.code}</span>
            <button
              type="button"
              onClick={copy}
              aria-label={`Copier le code ${offer.code}`}
              className="flex min-h-tap min-w-tap items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-night-soft"
            >
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>
      ) : (
        <Button variant="cta" full className="mt-3" onClick={() => redeemOffer(offer.id)}>
          Utiliser l'offre
        </Button>
      )}
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        Jusqu'au {formatDate(offer.validite, { weekday: false })}. {offer.conditions}
      </p>
    </Card>
  )
}

export default function MaCarte() {
  const { currentUser, offers, totalSavings, usedOffers, myBookings, myPasses, getAssociation, getPass } = useApp()
  const mySports = currentUser.sports.map((s) => s.sport)
  // Offres liées à mes sports en premier
  const sortedOffers = [...offers].sort((a, b) => mySports.includes(b.sport) - mySports.includes(a.sport))
  const upcoming = myBookings.filter((b) => b.statut === 'confirmee' && !isPast(b.date)).slice(0, 3)

  return (
    <PageShell title="Ma Carte">
      <MemberCard user={currentUser} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-3">
          <PiggyBank size={20} className="text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          <p className="mt-1 text-xl font-bold text-night dark:text-white">{formatEuros(totalSavings)}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">économisés · {usedOffers.length} offre(s)</p>
        </Card>
        <Card className="p-3">
          <Star size={20} className="text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <p className="mt-1 text-xl font-bold text-night dark:text-white">{currentUser.carte.pointsFidelite}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">points fidélité (démo)</p>
        </Card>
      </div>

      <SectionTitle>Avantages pour vous</SectionTitle>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2" aria-label="Offres partenaires">
        {sortedOffers.map((o) => (
          <OfferCard key={o.id} offer={o} />
        ))}
      </div>

      <SectionTitle action={<Link to="/reservations" className="flex min-h-tap items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400">Tout voir</Link>}>
        Mes prochaines réservations
      </SectionTitle>
      {upcoming.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Aucune réservation à venir">
          Réservez un créneau depuis l'onglet Explorer & Réserver.
        </EmptyState>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((b) => (
            <li key={b.id}>
              <LinkCard to={`/reservations/${b.id}`} className="flex items-center gap-3 p-3">
                <CalendarCheck size={20} className="shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-night dark:text-white">
                    {getAssociation(b.structureId)?.nom ?? 'Structure indisponible'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{b.prestation} · {formatDateTime(b.date)}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
              </LinkCard>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle action={<Link to="/pass" className="flex min-h-tap items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400">Acheter un pass</Link>}>
        Mes pass
      </SectionTitle>
      {myPasses.length === 0 ? (
        <EmptyState icon={Ticket} title="Aucun pass actif" />
      ) : (
        <ul className="space-y-2">
          {myPasses.map((p) => (
            <li key={p.id}>
              <LinkCard to="/pass" className="flex items-center gap-3 p-3">
                <Ticket size={20} className="shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-night dark:text-white">{getPass(p.passId)?.nom}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {p.seancesRestantes !== null ? `${p.seancesRestantes} séance(s) restante(s) · ` : ''}
                    jusqu'au {formatDate(p.expireLe, { weekday: false })}
                  </p>
                </div>
                <Badge tone="warning">Démo</Badge>
              </LinkCard>
            </li>
          ))}
        </ul>
      )}

      <LinkCard to="/pros" className="mt-6 flex items-center gap-3">
        <Building2 size={24} className="shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-night dark:text-white">Espace Associations & Pros</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Clubs, salles, organisateurs : rejoignez le réseau.</p>
        </div>
        <ChevronRight size={18} className="text-slate-400" aria-hidden="true" />
      </LinkCard>
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Sports suivis : {mySports.map(label).join(', ')}
      </p>
    </PageShell>
  )
}
