import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { hasClerk } from '@/lib/env';
import { Providers } from '@/app/providers';
import { SiteNav } from '@/components/site-nav';
import { TopNav } from '@/components/top-nav';
import { AtlasGuideMount } from '@/components/atlas-guide-mount';
import { ServiceWorkerRegister } from '@/components/sw-register';
import { OfflineBanner } from '@/components/offline-banner';
import './globals.css';

// Display serif (editorial, "field guide" character) + clean UI sans, both
// self-hosted by next/font (no external requests — CSP-safe).
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz'],
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

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
  themeColor: '#0b0a09',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Providers>
          <OfflineBanner />
          {/* Desktop gets a real top nav; mobile keeps the bottom tab bar. */}
          <TopNav />
          <div className="flex min-h-dvh flex-col md:pt-14">
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <SiteNav />
          </div>
          <AtlasGuideMount />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );

  return hasClerk ? <ClerkProvider>{shell}</ClerkProvider> : shell;
}
