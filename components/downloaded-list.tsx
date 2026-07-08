'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';
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

  if (!ready) return null;

  if (spots.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
        <div className="flex justify-center text-stone-500">
          <Icon name="save" size={28} />
        </div>
        <p className="mt-3 text-sm text-stone-300">No downloaded spots yet.</p>
        <p className="mt-1 text-sm text-stone-500">
          Open any spot and tap <span className="text-stone-300">Download for offline</span> to
          keep its location, directions, and safety notes with you when there&rsquo;s no signal.
        </p>
        <Link
          href="/spots"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-700 px-5 text-sm font-medium text-accent hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Browse spots
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-5 space-y-2">
      {spots.map((s) => {
        const color = FEATURE_TYPE_COLORS[s.feature_type as FeatureType] ?? '#a8a29e';
        return (
          <li
            key={s.slug}
            className="flex items-center gap-3 rounded-xl border border-stone-800 bg-surface-raised px-3 py-2.5"
          >
            <Link href={`/location/${s.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${color}22`, color }}
              >
                <Icon name={ICON_FOR[s.feature_type] ?? 'pin'} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-stone-100">{s.name}</span>
                <span className="text-xs text-stone-500">
                  {FEATURE_TYPE_LABELS[s.feature_type as FeatureType] ?? 'Spot'} · available offline
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => removeOffline(s.slug)}
              aria-label={`Remove ${s.name} from downloads`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 hover:bg-surface-overlay hover:text-stone-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Icon name="close" size={18} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
