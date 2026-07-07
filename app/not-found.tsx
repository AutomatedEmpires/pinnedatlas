import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="w-full max-w-shell rounded-2xl border border-stone-800 bg-surface-raised p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">404</p>
        <h1 className="mt-1 text-xl font-bold text-stone-50">Lost off the trail</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-400">
          This page doesn&rsquo;t exist — maybe it was moved, or maybe the trail marker fell
          over. Let&rsquo;s get you back to somewhere mapped.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-stone-950 hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Back to the map
          </Link>
          <Link
            href="/spots"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-5 text-sm font-semibold text-stone-200 hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Browse spots
          </Link>
        </div>
      </div>
    </div>
  );
}
