import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import PageShell from '../components/PageShell.jsx'
import { useApp } from '../context/AppContext.jsx'
import { Avatar, DemoNotice, EmptyState } from '../components/ui.jsx'
import { formatDateTime } from '../lib/format.js'

export default function Conversation() {
  const { id } = useParams()
  const { getConversation, getUser, getGroup, currentUserId, sendMessage } = useApp()
  const [texte, setTexte] = useState('')
  const endRef = useRef(null)
  const conversation = getConversation(id)
  const count = conversation?.messages.length

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [count])

  if (!conversation)
    return (
      <PageShell title="Conversation" back>
        <EmptyState title="Conversation introuvable" />
      </PageShell>
    )

  const isGroup = conversation.type === 'groupe'
  const other = isGroup ? null : getUser(conversation.participants.find((p) => p !== currentUserId))
  const groupe = isGroup ? getGroup(conversation.groupId) : null
  const titre = isGroup ? groupe?.nom ?? conversation.titre : `${other.prenom} ${other.nom}`
  const canWrite = conversation.participants.includes(currentUserId)

  const submit = (e) => {
    e.preventDefault()
    if (!texte.trim()) return
    sendMessage(conversation.id, texte)
    setTexte('')
  }

  const footer = canWrite ? (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-slate-200 bg-white p-2 dark:border-night-line dark:bg-night">
      <label htmlFor="message" className="sr-only">Votre message</label>
      <input
        id="message"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Écrire un message…"
        autoComplete="off"
        maxLength={500}
        className="min-h-tap flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm text-night dark:border-night-line dark:bg-night-soft dark:text-white"
      />
      <button
        type="submit"
        aria-label="Envoyer le message"
        disabled={!texte.trim()}
        className="flex min-h-tap min-w-tap items-center justify-center rounded-full bg-primary text-night disabled:opacity-50"
      >
        <Send size={20} aria-hidden="true" />
      </button>
    </form>
  ) : (
    <p className="border-t border-slate-200 p-3 text-center text-sm text-slate-600 dark:border-night-line dark:text-slate-400">
      Rejoignez le groupe pour participer à la discussion.
    </p>
  )

  return (
    <PageShell title={titre} back footer={footer}>
      {isGroup && groupe && (
        <Link to={`/communaute/groupes/${groupe.id}`} className="mb-3 flex min-h-tap items-center text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Voir le groupe ({groupe.nbMembres} membres)
        </Link>
      )}
      <DemoNotice>Conversation fictive : aucun message n'est réellement envoyé.</DemoNotice>
      {conversation.messages.length === 0 && <EmptyState title="Aucun message">Lancez la conversation !</EmptyState>}
      <ol className="space-y-3" aria-label="Messages">
        {conversation.messages.map((m) => {
          const mine = m.auteurId === currentUserId
          const auteur = getUser(m.auteurId)
          return (
            <li key={m.id} className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {!mine && <Avatar user={auteur} size={28} />}
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                mine ? 'rounded-br-sm bg-primary text-night' : 'rounded-bl-sm bg-white text-night shadow-sm dark:bg-night-soft dark:text-slate-100'
              }`}>
                {!mine && isGroup && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{auteur.prenom}</p>}
                <p className="whitespace-pre-line">{m.texte}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-night' : 'text-slate-500 dark:text-slate-400'}`}>{formatDateTime(m.date)}</p>
              </div>
            </li>
          )
        })}
      </ol>
      <div ref={endRef} />
    </PageShell>
  )
}
