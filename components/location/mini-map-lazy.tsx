'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// Defer the MapLibre bundle until the locator scrolls into view. Detail pages
// are the landing target for search traffic, which should not pay for the map
// engine just to read the guide.
const MiniMap = dynamic(() => import('@/components/location/mini-map').then((m) => m.MiniMap), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-surface-raised" />,
});

export function MiniMapLazy(props: { lat: number; lng: number; color: string; name: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '250px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref}>
      {show ? (
        <MiniMap {...props} />
      ) : (
        <div className="h-[200px] w-full rounded-xl bg-surface-raised" aria-hidden />
      )}
    </div>
  );
}
