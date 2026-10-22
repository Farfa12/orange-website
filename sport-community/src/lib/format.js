export const VILLES = ['Castelsarrasin', 'Montauban', 'Toulouse', 'Figeac', 'Rodez']

export const CATEGORIES_ANNONCES = {
  cherche_partenaire: 'Cherche partenaire',
  covoiturage: 'Covoiturage',
  materiel: 'Matériel',
  coaching: 'Coaching',
  remplacant: 'Remplaçant',
  sortie_spontanee: 'Sortie spontanée',
}

export const STATUTS_ANNONCES = {
  active: 'Active',
  pourvue: 'Pourvue',
  expiree: 'Expirée',
}

export const SPORTS = [
  'running', 'trail', 'vélo', 'randonnée', 'foot à 5', 'padel', 'yoga', 'natation', 'fitness', 'volley', 'multisport',
]

export const NIVEAUX = ['débutant', 'intermédiaire', 'confirmé', 'expert', 'tous niveaux']

export const NON_RENSEIGNE = 'Non renseigné'

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
export const label = (s) => capitalize(s ?? '')

// "2026-10-25" ou "2026-10-25T09:00" → Date locale (sans décalage UTC)
export function parseDate(value) {
  if (!value) return null
  const [d, t = '00:00'] = value.split('T')
  const [y, m, day] = d.split('-').map(Number)
  const [h, min] = t.split(':').map(Number)
  return new Date(y, m - 1, day, h, min)
}

export function formatDate(value, { weekday = true } = {}) {
  const d = parseDate(value)
  if (!d) return NON_RENSEIGNE
  return capitalize(
    d.toLocaleDateString('fr-FR', { weekday: weekday ? 'long' : undefined, day: 'numeric', month: 'long', year: 'numeric' }),
  )
}

export function formatDateShort(value) {
  const d = parseDate(value)
  if (!d) return NON_RENSEIGNE
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatTime(value) {
  if (!value || !value.includes('T')) return null
  return value.split('T')[1].replace(':', 'h')
}

export function formatDateTime(value) {
  const t = formatTime(value)
  return t ? `${formatDateShort(value)} · ${t}` : formatDateShort(value)
}

export function formatPrice(value) {
  if (value === null || value === undefined) return NON_RENSEIGNE
  if (value === 0) return 'Gratuit'
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export const formatEuros = (value) => (value ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

// Date locale au format des JSON : "AAAA-MM-JJTHH:mm"
export function nowISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function todayISO() {
  return nowISO().slice(0, 10)
}

export function isPast(value) {
  const d = parseDate(value)
  return d ? d.getTime() < Date.now() : false
}
