'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';

// A thin banner that appears when the browser goes offline, so users understand
// why they're seeing cached content.
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-1.5 bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-stone-950"
    >
      <Icon name="warning" size={14} weight="fill" />
      You&rsquo;re offline — showing saved &amp; recently viewed spots.
    </div>
  );
}
