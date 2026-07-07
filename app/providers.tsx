'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

let initialized = false;

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!POSTHOG_KEY || initialized) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    });
    initialized = true;
  }, []);

  useEffect(() => {
    if (initialized) posthog.capture('$pageview');
  }, [pathname]);

  return <>{children}</>;
}

export function captureEvent(name: string, props?: Record<string, unknown>) {
  if (initialized) posthog.capture(name, props);
}
