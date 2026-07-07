'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="w-full max-w-shell rounded-2xl border border-stone-800 bg-surface-raised p-6 text-center">
        <h1 className="text-xl font-bold text-stone-50">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          Sorry about that — an unexpected error interrupted the page. It&rsquo;s on us, not
          you. Trying again usually fixes it.
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-stone-600">Error reference: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-stone-950 hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
