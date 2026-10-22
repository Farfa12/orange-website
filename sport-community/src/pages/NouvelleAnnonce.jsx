import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Badge, Button, FormField, Input, Select, Textarea } from '../components/ui.jsx'
import { CATEGORIES_ANNONCES, SPORTS, VILLES, label } from '../lib/format.js'

export default function NouvelleAnnonce() {
  const { addAnnouncement, currentUser } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    categorie: 'cherche_partenaire',
    sport: currentUser.sports[0]?.sport ?? 'running',
    titre: '',
    description: '',
    lieu: VILLES.includes(currentUser.ville) ? currentUser.ville : VILLES[0],
    date: '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const valid = form.titre.trim().length >= 5 && form.description.trim().length >= 10 && form.date

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const id = addAnnouncement({ ...form, titre: form.titre.trim(), description: form.description.trim() })
    navigate(`/communaute/annonces/${id}`, { replace: true })
  }

  return (
    <PageShell title="Nouvelle annonce" back>
      <form onSubmit={submit} noValidate>
        <FormField label="Catégorie" id="categorie">
          <Select id="categorie" value={form.categorie} onChange={set('categorie')}
            options={Object.entries(CATEGORIES_ANNONCES).map(([value, l]) => ({ value, label: l }))} />
        </FormField>
        <FormField label="Sport" id="sport">
          <Select id="sport" value={form.sport} onChange={set('sport')} options={SPORTS.map((s) => ({ value: s, label: label(s) }))} />
        </FormField>
        <FormField label="Titre" id="titre" hint="5 caractères minimum">
          <Input id="titre" value={form.titre} onChange={set('titre')} maxLength={80} placeholder="Ex. : Cherche partenaire de footing le mardi soir" required />
        </FormField>
        <FormField label="Description" id="description" hint="10 caractères minimum">
          <Textarea id="description" value={form.description} onChange={set('description')} maxLength={500}
            placeholder="Niveau, allure, matériel, conditions…" required />
        </FormField>
        <FormField label="Ville" id="lieu">
          <Select id="lieu" value={form.lieu} onChange={set('lieu')} options={VILLES.map((v) => ({ value: v, label: v }))} />
        </FormField>
        <FormField label="Date et heure" id="date">
          <Input id="date" type="datetime-local" value={form.date} onChange={set('date')} required />
        </FormField>

        <label htmlFor="boost" className="mb-4 flex min-h-tap cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-orange-300 p-3 dark:border-orange-800">
          <Sparkles size={18} className="shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">Mettre en avant mon annonce</span>
          <Badge tone="cta">Bientôt disponible</Badge>
          <input id="boost" type="checkbox" disabled className="h-5 w-5" aria-describedby="boost-info" />
        </label>
        <p id="boost-info" className="sr-only">Option payante pas encore disponible.</p>

        <Button type="submit" variant="cta" full disabled={!valid}>Publier l'annonce</Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Prototype : l'annonce est enregistrée uniquement sur cet appareil.
        </p>
      </form>
    </PageShell>
  )
}
