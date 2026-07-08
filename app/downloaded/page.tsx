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
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <header>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 hover:text-stone-200"
        >
          <Icon name="back" size={16} />
          Back to the map
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-stone-100">
          <Icon name="save" size={22} className="text-accent" />
          Downloaded
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Available offline on this device — no account needed.
        </p>
      </header>

      <DownloadedList />
    </div>
  );
}
