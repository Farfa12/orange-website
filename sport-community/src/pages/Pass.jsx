import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Ticket, Check } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, DemoBadge, DemoNotice, SectionTitle } from '../components/ui.jsx'
import { formatDate, formatPrice } from '../lib/format.js'

export function PassContent() {
  const { passCatalogue, myPasses, getPass, buyPass } = useApp()
  const [justBought, setJustBought] = useState(null)

  return (
    <>
      <DemoNotice>Pass fictifs : achat simulé, aucun paiement, non valables dans les structures.</DemoNotice>

      {myPasses.length > 0 && (
        <>
          <SectionTitle>Mes pass</SectionTitle>
          <ul className="space-y-3">
            {myPasses.map((p) => (
              <li key={p.id}>
                <Card className={`flex items-center gap-4 ${justBought === p.id ? 'ring-2 ring-primary' : ''}`}>
                  <div className="rounded-lg bg-white p-1.5">
                    <QRCodeSVG value={p.qr} size={72} aria-label={`QR code du ${getPass(p.passId)?.nom} (démonstration)`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-night dark:text-white">{getPass(p.passId)?.nom}</p>
                    {p.seancesRestantes !== null && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{p.seancesRestantes} séance(s) restante(s)</p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400">Valable jusqu'au {formatDate(p.expireLe, { weekday: false })}</p>
                    <div className="mt-1"><DemoBadge /></div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <SectionTitle>Acheter un pass</SectionTitle>
      <ul className="space-y-3">
        {passCatalogue.map((p) => (
          <li key={p.id}>
            <Card>
              <div className="flex items-start gap-3">
                <Ticket size={22} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-night dark:text-white">{p.nom}</p>
                    <p className="font-bold text-night dark:text-white">{formatPrice(p.prix)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{p.description}</p>
                </div>
              </div>
              <Button variant="cta" full className="mt-3" onClick={() => setJustBought(buyPass(p.id))}>
                Acheter (simulation)
              </Button>
            </Card>
          </li>
        ))}
      </ul>
      {justBought && (
        <p role="status" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <Check size={16} aria-hidden="true" /> Pass ajouté à « Mes pass »
        </p>
      )}
    </>
  )
}

export default function Pass() {
  return (
    <PageShell title="Pass" back>
      <PassContent />
    </PageShell>
  )
}
