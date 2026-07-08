'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { OFFLINE_EVENT, isSavedOffline, removeOffline, saveForOffline } from '@/lib/offline';

export function SaveOfflineButton({
  slug,
  name,
  feature_type,
  imageUrl,
}: {
  slug: string;
  name: string;
  feature_type: string;
  imageUrl?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'caches' in window);
    const sync = () => setSaved(isSavedOffline(slug));
    sync();
    window.addEventListener(OFFLINE_EVENT, sync);
    return () => window.removeEventListener(OFFLINE_EVENT, sync);
  }, [slug]);

  if (!supported) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (saved) await removeOffline(slug);
      else await saveForOffline({ slug, name, feature_type, imageUrls: imageUrl ? [imageUrl] : [] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        saved
          ? 'bg-surface-overlay text-accent'
          : 'border border-stone-700 text-stone-200 hover:bg-surface-overlay'
      }`}
    >
      <Icon
        name={busy ? 'spinner' : saved ? 'check' : 'save'}
        size={18}
        weight={saved && !busy ? 'fill' : 'regular'}
        className={busy ? 'animate-spin' : ''}
      />
      {saved ? 'Saved offline' : 'Download for offline'}
    </button>
  );
}
