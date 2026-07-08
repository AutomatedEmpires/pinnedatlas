'use client';

import dynamic from 'next/dynamic';

// The AI guide is purely client-interactive and never needed for SSR or SEO, so
// we load its bundle after hydration instead of on the initial critical path.
const AtlasGuide = dynamic(() => import('@/components/atlas-guide').then((m) => m.AtlasGuide), {
  ssr: false,
});

export function AtlasGuideMount() {
  return <AtlasGuide />;
}
