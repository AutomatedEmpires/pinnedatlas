import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';
import { Reveal } from '@/components/reveal';
import { SectionHeading, badgeClass, buttonClass, cardClass, cn } from '@/components/ui';
import { FEATURE_TYPE_COLORS, FEATURE_TYPE_LABELS, type FeatureType } from '@/lib/types';

export const metadata: Metadata = {
  title: 'About',
  description:
    'PinnedAtlas is the map of caves, waterfalls, and hot springs worth the hike — built from open geodata and improved by the community.',
};

const FEATURES: { type: FeatureType; icon: IconName }[] = [
  { type: 'cave', icon: 'cave' },
  { type: 'waterfall', icon: 'waterfall' },
  { type: 'hot_spring', icon: 'hot_spring' },
  { type: 'spring', icon: 'spring' },
];

const PIPELINE: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'compass',
    title: 'Seeded',
    body: 'We start from trusted open geodata — public agencies and community-maintained map layers — to place spots with real, checkable coordinates.',
  },
  {
    icon: 'community',
    title: 'Improved',
    body: 'Explorers add missing spots, upload photos, and file condition reports, so the map keeps pace with the trail instead of a guidebook printed years ago.',
  },
  {
    icon: 'verified',
    title: 'Moderated',
    body: 'Every submission is reviewed by a person before it publishes. Nothing goes live unreviewed, and bad data gets corrected or removed.',
  },
];

const CREDITS: { name: string; note: string }[] = [
  { name: 'USGS GNIS', note: 'Geographic Names Information System' },
  { name: 'National Park Service', note: 'Public-land features and boundaries' },
  { name: 'Wikidata', note: 'Structured facts and cross-references' },
  { name: 'CARTO', note: 'Dark cartography basemap tiles' },
];

const EXPLORE_LINKS: { href: string; icon: IconName; title: string; body: string }[] = [
  { href: '/explore', icon: 'map', title: 'Explore the map', body: 'Pan the interactive map and find wonders near you.' },
  { href: '/collections', icon: 'save', title: 'Curated collections', body: 'Hand-picked routes and themed field guides.' },
  { href: '/spots', icon: 'list', title: 'Browse all spots', body: 'Filter thousands of locations by type and difficulty.' },
  { href: '/pricing', icon: 'premium', title: 'Go Premium', body: 'Unlimited saves, a trip log, and advanced filters.' },
];

const lead = 'text-lg leading-relaxed text-stone-200';
const body = 'text-[15px] leading-relaxed text-stone-300';

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <article className="space-y-16 lg:space-y-24">
        {/* Hero */}
        <Reveal>
          <header className="space-y-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              About PinnedAtlas
            </span>
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-stone-50 sm:text-5xl lg:text-6xl">
              The map of caves, waterfalls, and hot springs worth the hike.
            </h1>
            <p className={cn(lead, 'max-w-2xl')}>
              Natural wonders are scattered across forums, out-of-print guidebooks, and half-broken
              map layers. PinnedAtlas pulls them into one accurate, honest map — real coordinates,
              difficulty ratings, access notes, and fresh community-reported conditions — so you
              spend less time researching and more time outside.
            </p>

            {/* Feature-type legend */}
            <ul className="flex flex-wrap gap-2.5 pt-1">
              {FEATURES.map(({ type, icon }) => {
                const color = FEATURE_TYPE_COLORS[type];
                return (
                  <li
                    key={type}
                    className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-stone-200 ring-1 ring-inset ring-white/8"
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}24`, color }}
                    >
                      <Icon name={icon} size={13} weight="fill" />
                    </span>
                    {FEATURE_TYPE_LABELS[type]}
                  </li>
                );
              })}
            </ul>
          </header>
        </Reveal>

        {/* How the data works */}
        <Reveal>
          <section className="space-y-8">
            <SectionHeading eyebrow="The data" title="How the data works" className="max-w-2xl">
              <p className={cn(body, 'mt-3')}>
                Locations are seeded from open geodata, then improved by the community and reviewed
                by a moderator before they publish. Here is the path every spot travels.
              </p>
            </SectionHeading>

            <ol className="grid gap-4 sm:grid-cols-3">
              {PIPELINE.map((step, i) => (
                <li key={step.title} className={cardClass({ className: 'flex flex-col gap-3 p-5' })}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20">
                      <Icon name={step.icon} size={20} weight="fill" />
                    </span>
                    <span className="font-display text-2xl font-semibold text-stone-700">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-stone-100">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-stone-400">{step.body}</p>
                </li>
              ))}
            </ol>

            {/* Verified vs Community */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={cardClass({ className: 'p-5' })}>
                <div className="flex items-center gap-2">
                  <span className={badgeClass('accent')}>
                    <Icon name="verified" size={12} weight="fill" />
                    Verified
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  Cross-checked against multiple sources by a moderator. Coordinates and key details
                  have been confirmed — the closest thing to a sure bet on the map.
                </p>
              </div>
              <div className={cardClass({ className: 'p-5' })}>
                <div className="flex items-center gap-2">
                  <span className={badgeClass('sky')}>
                    <Icon name="community" size={12} weight="fill" />
                    Community
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  Approved for publishing but sourced from open data or a community submission. Treat
                  the details as a strong starting point and verify before you go.
                </p>
              </div>
            </div>

            <p className={cn(body, 'max-w-2xl')}>
              Every location shows its source and how recently conditions were reported, so you
              always know exactly how much to trust what you are reading.
            </p>
          </section>
        </Reveal>

        {/* Data sources & attribution */}
        <Reveal>
          <section className="space-y-6">
            <SectionHeading eyebrow="Credits" title="Data sources & attribution" className="max-w-2xl" />

            <div className={cardClass({ className: 'p-5 sm:p-6' })}>
              <p className="text-[15px] leading-relaxed text-stone-200">
                Map data ©{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
                >
                  OpenStreetMap contributors
                </a>
                , available under the Open Database License (ODbL). Basemap tiles ©{' '}
                <a
                  href="https://carto.com/attribution"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
                >
                  CARTO
                </a>
                .
              </p>
            </div>

            <p className={cn(body, 'max-w-2xl')}>
              Additional location data is sourced, with thanks, from the public agencies and open
              projects that keep geodata alive:
            </p>

            <ul className="grid gap-3 sm:grid-cols-2">
              {CREDITS.map((c) => (
                <li
                  key={c.name}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/8"
                >
                  <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-stone-500" />
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{c.name}</p>
                    <p className="text-sm text-stone-400">{c.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* Safety & stewardship */}
        <Reveal>
          <section className="space-y-6">
            <SectionHeading
              eyebrow="Out there"
              title="Safety & stewardship"
              className="max-w-2xl"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={cn(cardClass(), 'p-5 sm:p-6')}>
                <div className="flex items-center gap-2 text-topaz">
                  <Icon name="warning" size={20} weight="fill" />
                  <h3 className="text-base font-semibold text-stone-100">Wild means hazardous</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  These places are beautiful because they are wild — and conditions change with
                  every storm and season. Check recent reports, verify legal access, obey closures,
                  never enter private property without permission, and turn around when something
                  feels wrong. No spot is worth an injury.
                </p>
              </div>
              <div className={cn(cardClass(), 'p-5 sm:p-6')}>
                <div className="flex items-center gap-2 text-accent">
                  <Icon name="verified" size={20} weight="fill" />
                  <h3 className="text-base font-semibold text-stone-100">Leave it better</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  Pack out what you pack in, stay on durable surfaces, and leave every spot better
                  than you found it. We follow and recommend the{' '}
                  <a
                    href="https://lnt.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-accent underline underline-offset-2 hover:text-accent-strong"
                  >
                    Leave No Trace
                  </a>{' '}
                  principles.
                </p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Start exploring */}
        <Reveal>
          <section className="space-y-6">
            <SectionHeading eyebrow="Get going" title="Start exploring" className="max-w-2xl" />
            <div className="grid gap-4 sm:grid-cols-2">
              {EXPLORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    cardClass({ hover: true }),
                    'group flex items-center gap-4 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-inset ring-accent/20 transition-transform duration-200 ease-spring group-hover:scale-105">
                    <Icon name={link.icon} size={22} weight="fill" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-stone-50">{link.title}</span>
                    <span className="mt-0.5 block text-sm text-stone-400">{link.body}</span>
                  </span>
                  <Icon
                    name="directions"
                    size={16}
                    className="shrink-0 -rotate-90 text-stone-600 transition-colors group-hover:text-accent"
                  />
                </Link>
              ))}
            </div>
            <div className="pt-1">
              <Link href="/explore" className={buttonClass({ variant: 'primary', size: 'lg' })}>
                <Icon name="compass" size={18} weight="fill" />
                Open the map
              </Link>
            </div>
          </section>
        </Reveal>

        {/* Footer */}
        <footer className="space-y-3 border-t border-white/8 pt-8">
          <nav aria-label="About links" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href="/legal/terms"
              className="text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
            >
              Terms of Service
            </Link>
            <Link
              href="/legal/privacy"
              className="text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              href="/pricing"
              className="text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
            >
              Pricing
            </Link>
          </nav>
          <p className="text-xs text-stone-500">PinnedAtlas is operated by AutomatedEmpires.</p>
        </footer>
      </article>
    </div>
  );
}
