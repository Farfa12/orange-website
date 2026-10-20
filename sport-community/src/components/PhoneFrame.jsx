// Plein écran sur mobile ; cadre de téléphone centré (~390x844) à partir de 640px.
export default function PhoneFrame({ children }) {
  return (
    <div className="flex h-full w-full items-center justify-center sm:p-6">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-surface dark:bg-night
                   sm:h-[844px] sm:max-h-[calc(100vh-3rem)] sm:w-[390px]
                   sm:rounded-[3rem] sm:border-[10px] sm:border-night sm:shadow-2xl
                   sm:dark:border-slate-700"
      >
        {/* Encoche décorative (desktop uniquement) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-50 hidden h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-night sm:block sm:dark:bg-slate-700"
        />
        {children}
      </div>
    </div>
  )
}
