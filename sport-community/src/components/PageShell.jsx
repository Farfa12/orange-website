import Header from './Header.jsx'

// Gabarit commun : en-tête + zone de contenu défilante.
export default function PageShell({ title, children }) {
  return (
    <>
      <Header title={title} />
      <main className="flex-1 overflow-y-auto px-4 py-5">{children}</main>
    </>
  )
}
