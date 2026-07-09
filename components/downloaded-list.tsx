'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';
import { badgeClass, buttonClass, cardClass } from '@/components/ui';
import { timeAgo } from '@/lib/geo';
import { FEATURE_TYPE_COLORS, FEATURE_TYPE_LABELS, type FeatureType } from '@/lib/types';
import { OFFLINE_EVENT, listOffline, removeOffline, type OfflineSpot } from '@/lib/offline';

const ICON_FOR: Record<string, IconName> = {
  cave: 'cave',
  waterfall: 'waterfall',
  hot_spring: 'hot_spring',
  spring: 'spring',
  other: 'pin',
};

export function DownloadedList() {
  const [spots, setSpots] = useState<OfflineSpot[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSpots(listOffline());
    sync();
    setReady(true);
    window.addEventListener(OFFLINE_EVENT, sync);
    return () => window.removeEventListener(OFFLINE_EVENT, sync);
  }, []);

  // Avoid a hydration flash: render nothing until we've read localStorage.
  if (!ready) return null;

  if (spots.length === 0) {
    return (
      <div className={cardClass({ className: 'mt-8 p-8 text-center sm:p-12' })}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
          <Icon name="save" size={26} />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-stone-100">
          No downloaded spots yet
        </p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-400">
          Open any spot and tap{' '}
          <span className="font-medium text-stone-200">Download for offline</span> to keep its
          location, directions, and safety notes with you when there&rsquo;s no signal.
        </p>
        <Link
          href="/spots"
          className={buttonClass({ variant: 'primary', size: 'md', className: 'mt-6' })}
        >
          Browse spots
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-8" aria-label="Downloaded spots">
      <p className="text-sm font-medium tabular-nums text-stone-500">
        {spots.length} {spots.length === 1 ? 'spot' : 'spots'} available offline
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((s) => {
          const color = FEATURE_TYPE_COLORS[s.feature_type as FeatureType] ?? '#a8a29e';
          const label = FEATURE_TYPE_LABELS[s.feature_type as FeatureType] ?? 'Spot';
          return (
            <li
              key={s.slug}
              className="group relative flex items-center gap-3.5 rounded-2xl bg-surface-raised p-3 pr-2.5 hairline transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-surface-overlay hover:shadow-float focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
            >
              <Link
                href={`/location/${s.slug}`}
                className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl focus:outline-none"
              >
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
                  style={{ backgroundColor: `${color}1f`, color }}
                >
                  <Icon name={ICON_FOR[s.feature_type] ?? 'pin'} size={22} weight="fill" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-50">{s.name}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-none">
                    <span className={badgeClass('accent')}>
                      <Icon name="save" size={11} weight="fill" />
                      Offline
                    </span>
                    <span className="text-stone-500">{label}</span>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-500">{timeAgo(s.savedAt)}</span>
                  </span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => removeOffline(s.slug)}
                aria-label={`Remove ${s.name} from downloads`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-white/10 hover:text-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Icon name="close" size={18} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
