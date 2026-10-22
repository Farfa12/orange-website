import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import usersData from '../data/users.json'
import groupsData from '../data/groups.json'
import announcementsData from '../data/announcements.json'
import messagesData from '../data/messages.json'
import offersData from '../data/offers.json'
import passesData from '../data/passes.json'
import bookingsData from '../data/bookings.json'
import associationsData from '../data/associations.json'
import equipementsData from '../data/equipements.json'
import eventsData from '../data/events.json'
import { nowISO, todayISO } from '../lib/format.js'

// Seules les données modifiables par l'utilisateur sont persistées.
// Les données réelles (associations, équipements, événements) et les catalogues
// sont toujours relus depuis les JSON : une nouvelle collecte s'affiche sans vider le cache.
const STORAGE_KEY = 'sc-state'
const STORAGE_VERSION = 3

function seed() {
  return {
    version: STORAGE_VERSION,
    users: usersData.users,
    groups: groupsData,
    announcements: announcementsData,
    conversations: messagesData,
    myPasses: passesData.mesPass,
    bookings: bookingsData.reservations,
    usedOffers: [],
    eventParticipations: [],
    joinRequests: [],
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (saved?.version === STORAGE_VERSION) return { ...seed(), ...saved }
  } catch {
    // localStorage indisponible ou corrompu : on repart des données de démo
  }
  return seed()
}

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const round2 = (n) => Math.round(n * 100) / 100

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)
  const me = usersData.currentUserId

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // quota dépassé ou navigation privée : l'app reste utilisable sans persistance
    }
  }, [state])

  const patchItem = useCallback((collection, id, updater) => {
    setState((s) => ({
      ...s,
      [collection]: s[collection].map((item) => (item.id === id ? { ...item, ...updater(item) } : item)),
    }))
  }, [])

  const actions = useMemo(() => {
    const serviceFee = (prix) =>
      prix ? round2(Math.max((prix * bookingsData.fraisServicePourcentage) / 100, bookingsData.fraisServiceMinimum)) : 0

    return {
      /* ---------- Profil ---------- */
      updateProfile: (patch) => patchItem('users', me, () => patch),

      /* ---------- Annonces ---------- */
      addAnnouncement: ({ categorie, sport, titre, description, lieu, date, photo = null }) => {
        const id = uid('an')
        const annonce = { id, demo: true, categorie, auteurId: me, sport, titre, description, lieu, date, photo, statut: 'active', creeLe: nowISO() }
        setState((s) => ({ ...s, announcements: [annonce, ...s.announcements] }))
        return id
      },
      setAnnouncementStatus: (id, statut) => patchItem('announcements', id, () => ({ statut })),
      deleteAnnouncement: (id) =>
        setState((s) => ({ ...s, announcements: s.announcements.filter((a) => !(a.id === id && a.auteurId === me)) })),

      /* ---------- Groupes ---------- */
      createGroup: ({ nom, sport, ville, niveau, visibilite = 'public', description, prochaineSortie = null }) => {
        const id = uid('g')
        const groupe = { id, demo: true, nom, sport, ville, niveau, visibilite, nbMembres: 1, membres: [me], adminId: me, description, prochaineSortie }
        const conversation = { id: uid('c'), demo: true, type: 'groupe', groupId: id, titre: nom, participants: [me], messages: [] }
        setState((s) => ({ ...s, groups: [groupe, ...s.groups], conversations: [conversation, ...s.conversations] }))
        return id
      },
      joinGroup: (groupId) =>
        setState((s) => {
          const groupe = s.groups.find((g) => g.id === groupId)
          if (!groupe || groupe.membres.includes(me)) return s
          const hasConversation = s.conversations.some((c) => c.groupId === groupId)
          const conversations = hasConversation
            ? s.conversations.map((c) =>
                c.groupId === groupId && !c.participants.includes(me) ? { ...c, participants: [...c.participants, me] } : c,
              )
            : [{ id: uid('c'), demo: true, type: 'groupe', groupId, titre: groupe.nom, participants: [...groupe.membres, me], messages: [] }, ...s.conversations]
          return {
            ...s,
            groups: s.groups.map((g) => (g.id === groupId ? { ...g, membres: [...g.membres, me], nbMembres: g.nbMembres + 1 } : g)),
            conversations,
            joinRequests: s.joinRequests.filter((x) => x !== groupId),
          }
        }),
      requestJoinGroup: (groupId) =>
        setState((s) => (s.joinRequests.includes(groupId) ? s : { ...s, joinRequests: [...s.joinRequests, groupId] })),
      leaveGroup: (groupId) =>
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

      /* ---------- Messagerie ---------- */
      sendMessage: (conversationId, texte) => {
        const contenu = texte.trim()
        if (!contenu) return
        const message = { id: uid('m'), auteurId: me, texte: contenu, date: nowISO() }
        patchItem('conversations', conversationId, (c) => ({ messages: [...c.messages, message] }))
      },

      /* ---------- Offres sponsors (fictives) ---------- */
      redeemOffer: (offerId) =>
        setState((s) =>
          s.usedOffers.some((u) => u.offerId === offerId) ? s : { ...s, usedOffers: [...s.usedOffers, { offerId, date: nowISO() }] },
        ),

      /* ---------- Événements : participation locale, l'inscription officielle se fait chez l'organisateur ---------- */
      toggleEventParticipation: (eventId) =>
        setState((s) => ({
          ...s,
          eventParticipations: s.eventParticipations.includes(eventId)
            ? s.eventParticipations.filter((x) => x !== eventId)
            : [...s.eventParticipations, eventId],
        })),

      /* ---------- Réservations & pass (simulés) ---------- */
      computeServiceFee: serviceFee,
      addBooking: ({ structureId, prestation, date, prix }) => {
        const id = uid('b')
        const fraisService = serviceFee(prix)
        const reservation = {
          id, demo: true, userId: me, structureId, prestation, date, prix, fraisService,
          total: round2(prix + fraisService), statut: 'confirmee', qr: `DEMO-RES-${id}`,
        }
        setState((s) => ({ ...s, bookings: [reservation, ...s.bookings] }))
        return id
      },
      cancelBooking: (id) => patchItem('bookings', id, () => ({ statut: 'annulee' })),
      buyPass: (passId) => {
        const pass = passesData.catalogue.find((p) => p.id === passId)
        if (!pass) return null
        const id = uid('mp')
        const expire = new Date(Date.now() + pass.dureeValiditeJours * 86400000)
        const pad = (n) => String(n).padStart(2, '0')
        const monPass = {
          id, demo: true, passId, userId: me, achatLe: todayISO(),
          expireLe: `${expire.getFullYear()}-${pad(expire.getMonth() + 1)}-${pad(expire.getDate())}`,
          seancesRestantes: pass.seances, qr: `DEMO-PASS-${me}-${id}`,
        }
        setState((s) => ({ ...s, myPasses: [monPass, ...s.myPasses] }))
        return id
      },

      /* ---------- Démo ---------- */
      resetDemo: () => setState(seed()),
    }
  }, [me, patchItem])

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
        conversations: [{ id, demo: true, type: 'prive', groupId: null, titre: null, participants: [me, userId], messages: [] }, ...s.conversations],
      }))
      return id
    },
    [me, state.conversations],
  )

  const value = useMemo(() => {
    const byId = (list) => (id) => list.find((x) => x.id === id) ?? null
    const getUser = byId(state.users)
    const offerById = byId(offersData)
    return {
      ...state,
      offers: offersData,
      passCatalogue: passesData.catalogue,
      prestationsDemo: bookingsData.prestationsDemo,
      bookingConfig: { pourcentage: bookingsData.fraisServicePourcentage, minimum: bookingsData.fraisServiceMinimum },
      associations: associationsData,
      equipements: equipementsData,
      events: eventsData,
      currentUserId: me,
      currentUser: getUser(me),
      getUser,
      getGroup: byId(state.groups),
      getAnnouncement: byId(state.announcements),
      getConversation: byId(state.conversations),
      getEvent: byId(eventsData),
      getAssociation: byId(associationsData),
      getEquipement: byId(equipementsData),
      getBooking: byId(state.bookings),
      getPass: byId(passesData.catalogue),
      myGroups: state.groups.filter((g) => g.membres.includes(me)),
      myConversations: state.conversations
        .filter((c) => c.participants.includes(me))
        .sort((a, b) => (b.messages.at(-1)?.date ?? '').localeCompare(a.messages.at(-1)?.date ?? '')),
      myAnnouncements: state.announcements.filter((a) => a.auteurId === me),
      myBookings: state.bookings.filter((b) => b.userId === me).sort((a, b) => a.date.localeCompare(b.date)),
      isOfferUsed: (offerId) => state.usedOffers.some((u) => u.offerId === offerId),
      isParticipating: (eventId) => state.eventParticipations.includes(eventId),
      totalSavings: state.usedOffers.reduce((sum, u) => sum + (offerById(u.offerId)?.economie ?? 0), 0),
      ...actions,
      startConversation,
    }
  }, [state, me, actions, startConversation])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans un AppProvider')
  return ctx
}
