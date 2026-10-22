#!/usr/bin/env node
// Contrôle des données de src/data selon les règles de PROJET.md.
// Usage : node scripts/validate.mjs   (code de sortie 1 s'il y a des erreurs)
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')
const VILLES = ['Castelsarrasin', 'Montauban', 'Toulouse', 'Figeac', 'Rodez']
const DATE_MIN_EVENEMENT = '2026-10-20'
const CATEGORIES = ['cherche_partenaire', 'covoiturage', 'materiel', 'coaching', 'remplacant', 'sortie_spontanee']

const errors = []
const warnings = []
const err = (file, id, msg) => errors.push(`${file}${id ? ` [${id}]` : ''} : ${msg}`)
const warn = (msg) => warnings.push(msg)
const load = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf8'))

const isUrl = (v) => typeof v === 'string' && /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v)
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
const isDateLike = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(v) && !Number.isNaN(Date.parse(v))

// Aucun champ "avis", aucune chaîne vide ou pseudo-valeur à la place de null
function scan(file, value, path = '') {
  if (Array.isArray(value)) return value.forEach((v, i) => scan(file, v, `${path}[${i}]`))
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k.toLowerCase() === 'avis') err(file, null, `champ "avis" interdit (${path}.${k})`)
      scan(file, v, `${path}.${k}`)
    }
    return
  }
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase()
    if (t === '') err(file, null, `chaîne vide en ${path} (utiliser null)`)
    if (['non renseigné', 'n/a', 'na', 'inconnu', 'null', 'undefined', '?', 'à compléter', 'todo'].includes(t))
      err(file, null, `valeur de remplissage "${value}" en ${path} (utiliser null)`)
    if (/lorem ipsum/i.test(value)) err(file, null, `lorem ipsum en ${path}`)
  }
}

function requireFields(file, rec, fields) {
  for (const f of fields) if (!(f in rec)) err(file, rec.id, `champ obligatoire absent : ${f}`)
}

function noDuplicates(file, list, keyFn, label) {
  const seen = new Set()
  for (const r of list) {
    const k = keyFn(r)
    if (k == null) continue
    if (seen.has(k)) err(file, r.id, `doublon (${label}) : ${k}`)
    seen.add(k)
  }
}

/* ---------- Données réelles : associations, équipements, événements ---------- */
// Un enregistrement est soit réel (sourcé), soit une démo explicite dont les champs réels sont null.
function checkReal(file, list, { fields, villeField, realFields }) {
  if (!Array.isArray(list)) return err(file, null, 'doit être un tableau')
  for (const r of list) {
    requireFields(file, r, ['id', 'demo', ...fields])
    if (!VILLES.includes(r[villeField])) err(file, r.id, `ville hors zone : ${r[villeField]}`)
    if (r.demo === true) {
      if (!String(r.nom ?? '').startsWith('[DÉMO]')) err(file, r.id, 'une démo doit avoir un nom préfixé par "[DÉMO]"')
      for (const f of realFields) if (r[f] !== null) err(file, r.id, `démo : "${f}" doit valoir null (rien d'inventé)`)
    } else if (r.demo === false) {
      if (String(r.nom ?? '').includes('[DÉMO]')) err(file, r.id, 'donnée réelle marquée [DÉMO]')
      if (!isUrl(r.source_url)) err(file, r.id, `source_url absente ou invalide : ${r.source_url}`)
      if (!isDay(r.date_collecte)) err(file, r.id, `date_collecte absente ou invalide (AAAA-MM-JJ) : ${r.date_collecte}`)
      if (typeof r.source !== 'string') err(file, r.id, 'source (nom de la source) absente')
      for (const f of ['site_web', 'site_officiel'])
        if (f in r && r[f] !== null && !isUrl(r[f])) err(file, r.id, `${f} invalide : ${r[f]}`)
    } else err(file, r.id, 'champ "demo" doit valoir true ou false')
  }
  noDuplicates(file, list, (r) => r.id, 'id')
}

const associations = load('associations.json')
checkReal('associations.json', associations, {
  fields: ['nom', 'ville', 'sport', 'adresse', 'site_web', 'telephone', 'horaires', 'tarifs', 'source', 'source_url', 'date_collecte'],
  villeField: 'ville',
  realFields: ['adresse', 'site_web', 'telephone', 'horaires', 'tarifs', 'source', 'source_url', 'date_collecte'],
})
noDuplicates('associations.json', associations.filter((a) => !a.demo), (a) => `${a.nom.toLowerCase()}|${a.ville}`, 'nom + ville')

const equipements = load('equipements.json')
checkReal('equipements.json', equipements, {
  fields: ['nom', 'type', 'adresse', 'commune', 'source', 'source_url', 'date_collecte'],
  villeField: 'commune',
  realFields: ['adresse', 'source', 'source_url', 'date_collecte'],
})
noDuplicates('equipements.json', equipements.filter((e) => !e.demo), (e) => `${e.nom.toLowerCase()}|${e.commune}`, 'nom + commune')

const events = load('events.json')
checkReal('events.json', events, {
  fields: ['nom', 'date', 'ville', 'lieu', 'type', 'tarif', 'site_officiel', 'source', 'source_url', 'date_collecte'],
  villeField: 'ville',
  realFields: ['lieu', 'tarif', 'site_officiel', 'source', 'source_url', 'date_collecte'],
})
for (const e of events) {
  if (!isDay(e.date)) err('events.json', e.id, `date invalide : ${e.date}`)
  else if (e.date <= DATE_MIN_EVENEMENT) err('events.json', e.id, `date ${e.date} non postérieure au 20/10/2026`)
  if (e.tarif !== null && typeof e.tarif !== 'number') err('events.json', e.id, 'tarif doit être un nombre ou null')
}
noDuplicates('events.json', events.filter((e) => !e.demo), (e) => `${e.nom.toLowerCase()}|${e.date}`, 'nom + date')

for (const ville of VILLES) {
  const n = (list, f) => list.filter((x) => !x.demo && x[f] === ville).length
  const a = n(associations, 'ville'), q = n(equipements, 'commune'), e = n(events, 'ville')
  if (a + q + e === 0) warn(`${ville} : aucune donnée réelle collectée (associations ${a}, équipements ${q}, événements ${e})`)
}

/* ---------- Données fictives assumées ---------- */
function checkFictive(file, list, fields) {
  for (const r of list) {
    requireFields(file, r, ['id', 'demo', ...fields])
    if (r.demo !== true) err(file, r.id, 'donnée fictive : "demo" doit valoir true')
  }
  noDuplicates(file, list, (r) => r.id, 'id')
}

const usersFile = load('users.json')
const users = usersFile.users
checkFictive('users.json', users, ['prenom', 'nom', 'avatar', 'ville', 'sports', 'niveau', 'verifie'])
if (users.length < 9) err('users.json', null, `9 utilisateurs attendus (1 courant + 8), trouvé ${users.length}`)
if (!users.some((u) => u.id === usersFile.currentUserId)) err('users.json', null, 'currentUserId introuvable')
for (const u of users) {
  if (!VILLES.includes(u.ville)) err('users.json', u.id, `ville hors zone : ${u.ville}`)
  if (typeof u.verifie !== 'boolean') err('users.json', u.id, '"verifie" doit être un booléen')
}
const userIds = new Set(users.map((u) => u.id))

const groups = load('groups.json')
checkFictive('groups.json', groups, ['nom', 'sport', 'ville', 'niveau', 'visibilite', 'nbMembres', 'description', 'prochaineSortie'])
if (groups.length < 10) err('groups.json', null, `au moins 10 groupes attendus, trouvé ${groups.length}`)
if (new Set(groups.map((g) => g.sport)).size < 6) err('groups.json', null, 'sports pas assez variés (6 minimum)')
for (const g of groups) {
  if (!VILLES.includes(g.ville)) err('groups.json', g.id, `ville hors zone : ${g.ville}`)
  if (!userIds.has(g.adminId)) err('groups.json', g.id, `adminId inconnu : ${g.adminId}`)
  for (const m of g.membres ?? []) if (!userIds.has(m)) err('groups.json', g.id, `membre inconnu : ${m}`)
}

const announcements = load('announcements.json')
checkFictive('announcements.json', announcements, ['categorie', 'auteurId', 'sport', 'titre', 'description', 'lieu', 'date', 'photo', 'statut'])
if (announcements.length < 12) err('announcements.json', null, `au moins 12 annonces attendues, trouvé ${announcements.length}`)
for (const c of CATEGORIES) {
  const n = announcements.filter((a) => a.categorie === c).length
  if (n < 2) err('announcements.json', null, `catégorie ${c} : ${n} annonce(s), 2 minimum`)
}
for (const a of announcements) {
  if (!CATEGORIES.includes(a.categorie)) err('announcements.json', a.id, `catégorie inconnue : ${a.categorie}`)
  if (!['active', 'pourvue', 'expiree'].includes(a.statut)) err('announcements.json', a.id, `statut inconnu : ${a.statut}`)
  if (!userIds.has(a.auteurId)) err('announcements.json', a.id, `auteur inconnu : ${a.auteurId}`)
  if (!VILLES.includes(a.lieu)) err('announcements.json', a.id, `lieu hors zone : ${a.lieu}`)
  if (!isDateLike(a.date)) err('announcements.json', a.id, `date invalide : ${a.date}`)
}

const conversations = load('messages.json')
checkFictive('messages.json', conversations, ['type', 'participants', 'messages'])
const groupIds = new Set(groups.map((g) => g.id))
for (const c of conversations) {
  if (c.type === 'groupe' && !groupIds.has(c.groupId)) err('messages.json', c.id, `groupe inconnu : ${c.groupId}`)
  for (const p of c.participants) if (!userIds.has(p)) err('messages.json', c.id, `participant inconnu : ${p}`)
  for (const m of c.messages) if (!userIds.has(m.auteurId)) err('messages.json', c.id, `auteur inconnu : ${m.auteurId}`)
}

const offers = load('offers.json')
checkFictive('offers.json', offers, ['marque', 'sport', 'ville', 'titre', 'economie', 'code', 'validite', 'sponsorise'])
if (offers.length < 8) err('offers.json', null, `au moins 8 offres attendues, trouvé ${offers.length}`)
for (const o of offers) {
  if (typeof o.economie !== 'number' || o.economie <= 0) err('offers.json', o.id, 'economie doit être un montant positif en euros')
  if (!VILLES.includes(o.ville)) err('offers.json', o.id, `ville hors zone : ${o.ville}`)
}

const passes = load('passes.json')
checkFictive('passes.json', passes.catalogue, ['nom', 'prix', 'dureeValiditeJours'])
checkFictive('passes.json', passes.mesPass, ['passId', 'userId', 'expireLe'])

const bookings = load('bookings.json')
checkFictive('bookings.json', bookings.reservations, ['userId', 'structureId', 'prestation', 'date', 'prix', 'fraisService', 'total', 'statut'])
const structureIds = new Set(associations.map((a) => a.id))
for (const b of bookings.reservations) {
  if (!structureIds.has(b.structureId)) err('bookings.json', b.id, `structure inconnue : ${b.structureId}`)
  if (Math.round((b.prix + b.fraisService) * 100) !== Math.round(b.total * 100)) err('bookings.json', b.id, 'total ≠ prix + frais de service')
}

/* ---------- Scan global ---------- */
for (const [name, data] of [
  ['associations.json', associations], ['equipements.json', equipements], ['events.json', events],
  ['users.json', usersFile], ['groups.json', groups], ['announcements.json', announcements],
  ['messages.json', conversations], ['offers.json', offers], ['passes.json', passes], ['bookings.json', bookings],
]) scan(name, data)

/* ---------- Rapport ---------- */
const reels = (l) => l.filter((x) => x.demo === false).length
console.log('Données réelles   : ' + `associations ${reels(associations)}, équipements ${reels(equipements)}, événements ${reels(events)}`)
console.log('Données de démo   : ' + `associations ${associations.length - reels(associations)}, équipements ${equipements.length - reels(equipements)}, événements ${events.length - reels(events)}`)
for (const w of warnings) console.log(`⚠  ${w}`)
if (errors.length) {
  for (const e of errors) console.log(`✗ ${e}`)
  console.log(`\n${errors.length} erreur(s).`)
  process.exit(1)
}
console.log('\n✓ 0 erreur.')
