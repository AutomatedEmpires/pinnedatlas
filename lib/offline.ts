'use client';

// Client-side "download for offline" store. Works with NO account — the list of
// downloaded spots lives in localStorage and their pages/photos live in the
// `pa-offline-spots` Cache, which the service worker serves when offline.

const CACHE = 'pa-offline-spots';
const KEY = 'pa:offline-spots';
export const OFFLINE_EVENT = 'pa:offline-updated';

export interface OfflineSpot {
  slug: string;
  name: string;
  feature_type: string;
  savedAt: string;
}

function canUseCaches(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

export function listOffline(): OfflineSpot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as OfflineSpot[]) : [];
  } catch {
    return [];
  }
}

export function isSavedOffline(slug: string): boolean {
  return listOffline().some((s) => s.slug === slug);
}

function writeList(list: OfflineSpot[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(OFFLINE_EVENT));
  } catch {
    /* storage full or unavailable — the cached page still works */
  }
}

export async function saveForOffline(spot: {
  slug: string;
  name: string;
  feature_type: string;
  imageUrls?: string[];
}): Promise<void> {
  if (typeof window === 'undefined') return;
  if (canUseCaches()) {
    try {
      const cache = await caches.open(CACHE);
      // Same-origin page HTML: cache.add fetches + stores it.
      await cache.add(`/location/${spot.slug}`).catch(() => {});
      // Cross-origin photos (Wikimedia) don't send CORS headers, so cache.add
      // fails — fetch no-cors and store the opaque response instead.
      for (const u of spot.imageUrls ?? []) {
        try {
          const res = await fetch(u, { mode: 'no-cors' });
          await cache.put(u, res);
        } catch {
          /* image unavailable — the offline page still works without it */
        }
      }
    } catch {
      /* Cache API unavailable — fall back to just the metadata list */
    }
  }
  const list = listOffline().filter((s) => s.slug !== spot.slug);
  list.unshift({
    slug: spot.slug,
    name: spot.name,
    feature_type: spot.feature_type,
    savedAt: new Date().toISOString(),
  });
  writeList(list);
}

export async function removeOffline(slug: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (canUseCaches()) {
    try {
      const cache = await caches.open(CACHE);
      await cache.delete(`/location/${slug}`).catch(() => {});
    } catch {
      /* ignore */
    }
  }
  writeList(listOffline().filter((s) => s.slug !== slug));
}
