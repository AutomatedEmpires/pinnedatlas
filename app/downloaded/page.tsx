import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { DownloadedList } from '@/components/downloaded-list';

export const metadata: Metadata = {
  title: 'Downloaded spots',
  description: 'Spots you have saved to view offline, with no signal.',
  robots: { index: false, follow: false },
};

export default function DownloadedPage() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header className="max-w-2xl">
        <Link
          href="/"
          className="inline-flex min-h-9 items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-200"
        >
          <Icon name="back" size={16} />
          Back to the map
        </Link>

        <span className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Offline
        </span>
        <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/25">
            <Icon name="save" size={22} weight="fill" />
          </span>
          Downloaded
        </h1>
        <p className="mt-3 text-base text-stone-400">
          Kept on this device for when the signal drops — no account needed. Locations, directions,
          and safety notes travel with you.
        </p>
      </header>

      <DownloadedList />
    </div>
  );
}
