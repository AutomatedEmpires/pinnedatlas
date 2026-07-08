import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-shell flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised">
        <Icon name="compass" size={36} className="text-accent" />
      </span>
      <h1 className="text-xl font-semibold text-stone-100">You&rsquo;re offline</h1>
      <p className="max-w-xs text-sm leading-relaxed text-stone-400">
        No signal out here — often a good sign. You can still open spots you&rsquo;ve viewed or
        downloaded for offline use, including their location, directions, and safety notes.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/downloaded"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="save" size={18} />
          Downloaded spots
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone-700 px-5 text-sm font-medium text-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="map" size={18} />
          Back to the map
        </Link>
      </div>
    </div>
  );
}
