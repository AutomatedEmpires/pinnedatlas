export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[70dvh] items-center justify-center bg-surface"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-stone-800 border-t-accent" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
