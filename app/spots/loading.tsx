// Route-level skeleton for /spots. Mirrors the real layout (header, filter rows,
// card list) inside the same shell container so the swap-in is seamless.
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <div className="animate-pulse space-y-4" aria-hidden>
        {/* Header + search */}
        <div className="h-8 w-40 rounded-lg bg-surface-raised" />
        <div className="h-4 w-24 rounded bg-surface-raised" />
        <div className="h-11 w-full rounded-lg bg-surface-raised" />

        {/* Sort + filter chip rows */}
        <div className="flex gap-2">
          <div className="h-11 w-40 rounded-lg bg-surface-raised" />
          <div className="h-11 w-24 rounded-full bg-surface-raised" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 w-24 shrink-0 rounded-full bg-surface-raised" />
          ))}
        </div>

        {/* Card list */}
        <div className="space-y-2 pt-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-16 items-center gap-3 rounded-xl border border-stone-800 bg-surface-raised p-3"
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-surface-overlay" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-surface-overlay" />
                <div className="h-3 w-1/2 rounded bg-surface-overlay" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span role="status" className="sr-only">
        Loading spots…
      </span>
    </div>
  );
}
