import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import usersData from '../data/users.json'
import groupsData from '../data/groups.json'
import announcementsData from '../data/announcements.json'
import eventsData from '../data/events.json'
import offersData from '../data/offers.json'
import associationsData from '../data/associations.json'
import messagesData from '../data/messages.json'
import passesData from '../data/passes.json'
import bookingsData from '../data/bookings.json'

// Incrémenter la version si la structure des JSON change : l'état local sera réinitialisé.
const STORAGE_KEY = 'sc-data'
const STORAGE_VERSION = 1

export const CATEGORIES_ANNONCES = {
  cherche_partenaire: 'Cherche partenaire',
  covoiturage: 'Covoiturage',
  materiel: 'Matériel',
  coaching: 'Coaching',
  remplacant: 'Remplaçant',
  sortie_spontanee: 'Sortie spontanée',
}

function buildInitialState() {
  return {
    version: STORAGE_VERSION,
    currentUserId: usersData.currentUserId,
    users: usersData.users,
    groups: groupsData,
    announcements: announcementsData,
    events: eventsData,
    offers: offersData,
    associations: associationsData,
    conversations: messagesData,
    passCatalogue: passesData.catalogue,
    myPasses: passesData.mesPass,
    bookings: bookingsData.reservations,
    bookingConfig: {
      fraisServicePourcentage: bookingsData.fraisServicePourcentage,
      fraisServiceMinimum: bookingsData.fraisServiceMinimum,
    },
    usedOffers: [],
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved?.version === STORAGE_VERSION) return saved
    }
  } catch {
    // localStorage indisponible ou corrompu : on repart des données de démo
  }
  return buildInitialState()
}

// Date locale au format des JSON : "AAAA-MM-JJTHH:mm"
function nowISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

const round2 = (n) => Math.round(n * 100) / 100

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // quota dépassé ou navigation privée : l'app reste utilisable sans persistance
    }
  }, [state])

  const me = state.currentUserId

  // Met à jour un élément d'une collection par son id
  const patchItem = useCallback((collection, id, updater) => {
    setState((s) => ({
      ...s,
      [collection]: s[collection].map((item) => (item.id === id ? { ...item, ...updater(item) } : item)),
    }))
  }, [])

  /* ---------- Profil ---------- */
  const updateProfile = useCallback(
    (patch) => patchItem('users', me, () => patch),
    [me, patchItem],
  )

  const toggleFavorite = useCallback(
    (kind, id) =>
      patchItem('users', me, (u) => {
        const favoris = u.favoris ?? { associations: [], evenements: [] }
        const list = favoris[kind] ?? []
        return {
          favoris: { ...favoris, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] },
        }
      }),
    [me, patchItem],
  )

  /* ---------- Annonces ---------- */
  const addAnnouncement = useCallback(
    ({ categorie, sport, titre, description, lieu, date, photo = null }) => {
      const id = uid('an')
      const annonce = { id, categorie, auteurId: me, sport, titre, description, lieu, date, photo, statut: 'active', creeLe: nowISO() }
      setState((s) => ({ ...s, announcements: [annonce, ...s.announcements] }))
      return id
    },
    [me],
  )

  const setAnnouncementStatus = useCallback(
    (id, statut) => patchItem('announcements', id, () => ({ statut })),
    [patchItem],
  )

  const deleteAnnouncement = useCallback(
    (id) =>
      setState((s) => ({
        ...s,
        announcements: s.announcements.filter((a) => !(a.id === id && a.auteurId === s.currentUserId)),
      })),
    [],
  )

  /* ---------- Groupes ---------- */
  const createGroup = useCallback(
    ({ nom, sport, ville, niveau, visibilite = 'public', description, prochaineSortie = null }) => {
      const id = uid('g')
      const groupe = { id, nom, sport, ville, niveau, visibilite, nbMembres: 1, membres: [me], adminId: me, description, prochaineSortie }
      const conversation = { id: uid('c'), type: 'groupe', groupId: id, titre: nom, participants: [me], messages: [] }
      setState((s) => ({ ...s, groups: [groupe, ...s.groups], conversations: [conversation, ...s.conversations] }))
      return id
    },
    [me],
  )

  const joinGroup = useCallback(
    (groupId) =>
      setState((s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.id === groupId && !g.membres.includes(me) ? { ...g, membres: [...g.membres, me], nbMembres: g.nbMembres + 1 } : g,
        ),
        conversations: s.conversations.map((c) =>
          c.groupId === groupId && !c.participants.includes(me) ? { ...c, participants: [...c.participants, me] } : c,
        ),
      })),
    [me],
  )

  const leaveGroup = useCallback(
    (groupId) =>
      setState((s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.id === groupId && g.membres.includes(me)
            ? { ...g, membres: g.membres.filter((x) => x !== me), nbMembres: Math.max(0, g.nbMembres - 1) }
            : g,
        ),
        conversations: s.conversations.map((c) =>
          c.groupId === groupId ? { ...c, participants: c.participants.filter((x) => x !== me) } : c,
        ),
      })),
    [me],
  )

  /* ---------- Messagerie ---------- */
  const sendMessage = useCallback(
    (conversationId, texte) => {
      const contenu = texte.trim()
      if (!contenu) return
      const message = { id: uid('m'), auteurId: me, texte: contenu, date: nowISO() }
      patchItem('conversations', conversationId, (c) => ({ messages: [...c.messages, message] }))
    },
    [me, patchItem],
  )

  // Renvoie l'id de la conversation privée avec cet utilisateur (créée si besoin)
  const startConversation = useCallback(
    (userId) => {
      const existante = state.conversations.find(
        (c) => c.type === 'prive' && c.participants.includes(me) && c.participants.includes(userId),
      )
      if (existante) return existante.id
      const id = uid('c')
      setState((s) => ({
        ...s,
        conversations: [{ id, type: 'prive', groupId: null, titre: null, participants: [me, userId], messages: [] }, ...s.conversations],
      }))
      return id
    },
    [me, state.conversations],
  )

  /* ---------- Offres sponsors ---------- */
  const redeemOffer = useCallback((offerId) => {
    setState((s) =>
      s.usedOffers.some((u) => u.offerId === offerId)
        ? s
        : { ...s, usedOffers: [...s.usedOffers, { offerId, date: nowISO() }] },
    )
    return state.offers.find((o) => o.id === offerId)?.code ?? null
  }, [state.offers])

  /* ---------- Événements ---------- */
  const registerEvent = useCallback(
    (eventId) =>
      patchItem('events', eventId, (e) =>
        e.inscritsIds.includes(me) || e.inscrits >= e.places
          ? {}
          : { inscritsIds: [...e.inscritsIds, me], inscrits: e.inscrits + 1 },
      ),
    [me, patchItem],
  )

  const unregisterEvent = useCallback(
    (eventId) =>
      patchItem('events', eventId, (e) =>
        e.inscritsIds.includes(me)
          ? { inscritsIds: e.inscritsIds.filter((x) => x !== me), inscrits: Math.max(0, e.inscrits - 1) }
          : {},
      ),
    [me, patchItem],
  )

  /* ---------- Réservations & pass ---------- */
  const computeServiceFee = useCallback(
    (prix) => {
      if (!prix) return 0
      const { fraisServicePourcentage, fraisServiceMinimum } = state.bookingConfig
      return round2(Math.max((prix * fraisServicePourcentage) / 100, fraisServiceMinimum))
    },
    [state.bookingConfig],
  )

  const addBooking = useCallback(
    ({ associationId, prestation, date, prix }) => {
      const id = uid('b')
      const fraisService = computeServiceFee(prix)
      const reservation = {
        id,
        userId: me,
        associationId,
        prestation,
        date,
        prix,
        fraisService,
        total: round2(prix + fraisService),
        statut: 'confirmee',
        qr: `SC-RES-${id}`,
      }
      setState((s) => ({ ...s, bookings: [reservation, ...s.bookings] }))
      return reservation
    },
    [me, computeServiceFee],
  )

  const cancelBooking = useCallback(
    (id) => patchItem('bookings', id, () => ({ statut: 'annulee' })),
    [patchItem],
  )

  const buyPass = useCallback(
    (passId) => {
      const pass = state.passCatalogue.find((p) => p.id === passId)
      if (!pass) return null
      const id = uid('mp')
      const achat = new Date()
      const expire = new Date(achat.getTime() + pass.dureeValiditeJours * 86400000)
      const monPass = {
        id,
        passId,
        userId: me,
        achatLe: achat.toISOString().slice(0, 10),
        expireLe: expire.toISOString().slice(0, 10),
        seancesRestantes: pass.seances,
        qr: `SC-PASS-${me}-${id}`,
      }
      setState((s) => ({ ...s, myPasses: [monPass, ...s.myPasses] }))
      return monPass
    },
    [me, state.passCatalogue],
  )

  const consumePassSession = useCallback(
    (myPassId) =>
      patchItem('myPasses', myPassId, (p) =>
        p.seancesRestantes > 0 ? { seancesRestantes: p.seancesRestantes - 1 } : {},
      ),
    [patchItem],
  )

  /* ---------- Démo ---------- */
  const resetDemo = useCallback(() => setState(buildInitialState()), [])

  /* ---------- Sélecteurs ---------- */
  const value = useMemo(() => {
    const byId = (list) => (id) => list.find((x) => x.id === id) ?? null
    const currentUser = state.users.find((u) => u.id === me)
    const totalSavings = state.usedOffers.reduce(
      (sum, u) => sum + (state.offers.find((o) => o.id === u.offerId)?.economie ?? 0),
      0,
    )
    return {
      ...state,
      currentUser,
      getUser: byId(state.users),
      getGroup: byId(state.groups),
      getEvent: byId(state.events),
      getAssociation: byId(state.associations),
      getConversation: byId(state.conversations),
      myGroups: state.groups.filter((g) => g.membres.includes(me)),
      myConversations: state.conversations.filter((c) => c.participants.includes(me)),
      myAnnouncements: state.announcements.filter((a) => a.auteurId === me),
      myBookings: state.bookings.filter((b) => b.userId === me),
      myEvents: state.events.filter((e) => e.inscritsIds.includes(me)),
      isOfferUsed: (offerId) => state.usedOffers.some((u) => u.offerId === offerId),
      totalSavings,
      updateProfile,
      toggleFavorite,
      addAnnouncement,
      setAnnouncementStatus,
      deleteAnnouncement,
      createGroup,
      joinGroup,
      leaveGroup,
      sendMessage,
      startConversation,
      redeemOffer,
      registerEvent,
      unregisterEvent,
      computeServiceFee,
      addBooking,
      cancelBooking,
      buyPass,
      consumePassSession,
      resetDemo,
    }
  }, [
    state, me, updateProfile, toggleFavorite, addAnnouncement, setAnnouncementStatus, deleteAnnouncement,
    createGroup, joinGroup, leaveGroup, sendMessage, startConversation, redeemOffer, registerEvent,
    unregisterEvent, computeServiceFee, addBooking, cancelBooking, buyPass, consumePassSession, resetDemo,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans un AppProvider')
  return ctx
}
