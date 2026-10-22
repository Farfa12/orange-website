import Header from './Header.jsx'

// Gabarit commun : en-tête + zone de contenu défilante (+ pied fixe optionnel, ex. saisie de message).
export default function PageShell({ title, back = false, footer = null, children }) {
  return (
    <>
      <Header title={title} back={back} />
      <main className="flex-1 overflow-y-auto px-4 py-5">{children}</main>
      {footer}
    </>
  )
}
