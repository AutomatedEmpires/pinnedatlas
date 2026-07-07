import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { hasClerk } from '@/lib/env';
import { Providers } from '@/app/providers';
import { SiteNav } from '@/components/site-nav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PinnedAtlas — Caves, Waterfalls & Hot Springs',
    template: '%s · PinnedAtlas',
  },
  description:
    'Find caves, waterfalls, hot springs, and other natural wonders near you — with accurate locations, difficulty ratings, and community-reported conditions.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'PinnedAtlas',
    description: 'The map of caves, waterfalls, and hot springs worth the hike.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0a09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-dvh flex-col">
            <main className="flex-1 pb-16">{children}</main>
            <SiteNav />
          </div>
        </Providers>
      </body>
    </html>
  );

  return hasClerk ? <ClerkProvider>{shell}</ClerkProvider> : shell;
}
