import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Button, FormField, Input, Select, Textarea } from '../components/ui.jsx'
import { NIVEAUX, SPORTS, VILLES, label } from '../lib/format.js'

export default function NouveauGroupe() {
  const { createGroup, currentUser } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nom: '',
    sport: currentUser.sports[0]?.sport ?? 'running',
    ville: VILLES.includes(currentUser.ville) ? currentUser.ville : VILLES[0],
    niveau: 'tous niveaux',
    visibilite: 'public',
    description: '',
    sortieDate: '',
    sortieIntitule: '',
  })
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const valid = form.nom.trim().length >= 3 && form.description.trim().length >= 10

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    const id = createGroup({
      nom: form.nom.trim(),
      sport: form.sport,
      ville: form.ville,
      niveau: form.niveau,
      visibilite: form.visibilite,
      description: form.description.trim(),
      prochaineSortie: form.sortieDate
        ? { date: form.sortieDate, lieu: `${form.ville} – rendez-vous communiqué aux membres`, intitule: form.sortieIntitule.trim() || 'Sortie du groupe' }
        : null,
    })
    navigate(`/communaute/groupes/${id}`, { replace: true })
  }

  return (
    <PageShell title="Nouveau groupe" back>
      <form onSubmit={submit} noValidate>
        <FormField label="Nom du groupe" id="nom" hint="3 caractères minimum">
          <Input id="nom" value={form.nom} onChange={set('nom')} maxLength={60} placeholder="Ex. : Footing du midi – Montauban" required />
        </FormField>
        <FormField label="Sport" id="sport">
          <Select id="sport" value={form.sport} onChange={set('sport')} options={SPORTS.map((s) => ({ value: s, label: label(s) }))} />
        </FormField>
        <FormField label="Ville" id="ville">
          <Select id="ville" value={form.ville} onChange={set('ville')} options={VILLES.map((v) => ({ value: v, label: v }))} />
        </FormField>
        <FormField label="Niveau" id="niveau">
          <Select id="niveau" value={form.niveau} onChange={set('niveau')} options={NIVEAUX.map((n) => ({ value: n, label: label(n) }))} />
        </FormField>
        <FormField label="Visibilité" id="visibilite" hint="Un groupe privé demande une validation pour le rejoindre.">
          <Select id="visibilite" value={form.visibilite} onChange={set('visibilite')}
            options={[{ value: 'public', label: 'Public' }, { value: 'privé', label: 'Privé' }]} />
        </FormField>
        <FormField label="Description" id="description" hint="10 caractères minimum">
          <Textarea id="description" value={form.description} onChange={set('description')} maxLength={400} required />
        </FormField>
        <FormField label="Première sortie (facultatif)" id="sortieDate">
          <Input id="sortieDate" type="datetime-local" value={form.sortieDate} onChange={set('sortieDate')} />
        </FormField>
        {form.sortieDate && (
          <FormField label="Intitulé de la sortie" id="sortieIntitule">
            <Input id="sortieIntitule" value={form.sortieIntitule} onChange={set('sortieIntitule')} maxLength={60} placeholder="Ex. : Boucle de 8 km" />
          </FormField>
        )}
        <Button type="submit" variant="primary" full disabled={!valid}>Créer le groupe</Button>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Prototype : le groupe est enregistré uniquement sur cet appareil.
        </p>
      </form>
    </PageShell>
  )
}
