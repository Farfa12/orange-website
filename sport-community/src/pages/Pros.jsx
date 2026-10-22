import { useState } from 'react'
import { Building2, Megaphone, CalendarCheck, Sparkles, MapPinned, Check } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { Badge, Button, Card, DemoNotice, FormField, Input, SectionTitle } from '../components/ui.jsx'

const OFFRES = [
  {
    icon: MapPinned,
    titre: 'Référencement de votre structure',
    texte: 'Votre club, votre salle ou votre événement visibles par les sportifs de votre ville, avec horaires, tarifs et lien vers votre site.',
  },
  {
    icon: Megaphone,
    titre: 'Offres sponsorisées natives',
    texte: 'Proposez un avantage aux porteurs de la carte, ciblé par sport et par ville. Les offres sont clairement signalées « Sponsorisé ».',
  },
  {
    icon: CalendarCheck,
    titre: 'Réservations & billetterie',
    texte: "Recevez des réservations depuis l'application. Des frais de service sont appliqués à l'utilisateur, affichés avant la confirmation.",
  },
]

export default function Pros() {
  const [envoye, setEnvoye] = useState(false)
  const [structure, setStructure] = useState('')

  return (
    <PageShell title="Associations & Pros" back>
      <section className="rounded-3xl bg-gradient-to-br from-night to-emerald-900 p-5 text-white">
        <Building2 size={28} className="text-primary" aria-hidden="true" />
        <h2 className="mt-2 text-xl font-bold">Espace Associations & Pros</h2>
        <p className="mt-1 text-sm text-slate-200">
          Associations, salles, organisateurs, commerces : touchez les sportifs locaux là où ils cherchent déjà leurs prochaines séances.
        </p>
      </section>

      <SectionTitle>Ce que nous proposons</SectionTitle>
      <ul className="space-y-3">
        {OFFRES.map(({ icon: Icon, titre, texte }) => (
          <li key={titre}>
            <Card className="flex gap-3">
              <Icon size={22} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <div>
                <p className="font-semibold text-night dark:text-white">{titre}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{texte}</p>
              </div>
            </Card>
          </li>
        ))}
        <li>
          <Card className="flex gap-3 border-dashed">
            <Sparkles size={22} className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <div>
              <p className="flex flex-wrap items-center gap-2 font-semibold text-night dark:text-white">
                Annonce mise en avant <Badge tone="cta">Bientôt disponible</Badge>
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Remontez une annonce ou un événement en tête de liste.</p>
            </div>
          </Card>
        </li>
      </ul>

      <SectionTitle>Être recontacté</SectionTitle>
      <DemoNotice>Formulaire de démonstration : aucune donnée n'est envoyée.</DemoNotice>
      {envoye ? (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Check size={18} aria-hidden="true" /> Demande simulée enregistrée. Merci !
        </p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (structure.trim()) setEnvoye(true) }}>
          <FormField label="Nom de votre structure" id="structure">
            <Input id="structure" value={structure} onChange={(e) => setStructure(e.target.value)} required />
          </FormField>
          <Button type="submit" variant="cta" full disabled={!structure.trim()}>Demander une présentation</Button>
        </form>
      )}
    </PageShell>
  )
}
