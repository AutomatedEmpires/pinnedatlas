import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';

export const metadata: Metadata = {
  title: 'About',
  description:
    'PinnedAtlas is the map of caves, waterfalls, and hot springs worth the hike — built from open geodata and improved by the community.',
};

const p = 'text-sm leading-relaxed text-stone-300';

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <article className="space-y-10">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold text-stone-50">About PinnedAtlas</h1>
          <p className="text-base leading-relaxed text-stone-200">
            The map of caves, waterfalls, and hot springs worth the hike.
          </p>
          <p className={p}>
            Natural wonders are scattered across forums, old guidebooks, and half-broken map
            layers. PinnedAtlas pulls them into one accurate, honest map — with real
            coordinates, difficulty ratings, access notes, and fresh community-reported
            conditions — so you spend less time researching and more time outside.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-100">How the data works</h2>
          <p className={p}>
            Locations are seeded from open geodata sources, then improved by the community.
            Anyone can submit a new spot or a condition report, and every submission is
            moderated before it is published — nothing goes live unreviewed.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 rounded-xl border border-stone-800 bg-surface-raised p-4">
              <Icon name="verified" size={22} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-stone-100">Verified</p>
                <p className="text-sm leading-relaxed text-stone-400">
                  Reviewed against multiple sources by a moderator. Coordinates and key
                  details have been cross-checked.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-stone-800 bg-surface-raised p-4">
              <Icon name="community" size={22} className="mt-0.5 shrink-0 text-sky-400" />
              <div>
                <p className="text-sm font-semibold text-stone-100">Community</p>
                <p className="text-sm leading-relaxed text-stone-400">
                  Approved for publishing but sourced from open data or a community
                  submission — treat details as a starting point and verify before you go.
                </p>
              </div>
            </li>
          </ul>
          <p className={p}>
            Every location shows its source and how recently conditions were reported, so you
            always know how much to trust what you are reading.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-100">Data sources & attribution</h2>
          <p className={p}>
            Map data ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2"
            >
              OpenStreetMap contributors
            </a>
            , available under the Open Database License (ODbL).
          </p>
          <p className={p}>Additional location data is sourced with thanks from:</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-300">
            <li>USGS Geographic Names Information System (GNIS)</li>
            <li>National Park Service</li>
            <li>Wikidata</li>
          </ul>
          <p className={p}>
            We are grateful to the volunteers and public agencies who keep open geodata alive.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-100">Safety & stewardship</h2>
          <p className={p}>
            These places are beautiful because they are wild — and wild means hazardous.
            Conditions change with every storm and season. Check recent reports, verify legal
            access, obey closures, never enter private property without permission, and turn
            around when something feels wrong. No spot is worth an injury.
          </p>
          <p className={p}>
            Pack out what you pack in, stay on durable surfaces, and leave every spot better
            than you found it. We follow and recommend the{' '}
            <a
              href="https://lnt.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2"
            >
              Leave No Trace
            </a>{' '}
            principles.
          </p>
        </section>

        <footer className="space-y-2 border-t border-stone-800 pt-6">
          <nav aria-label="About links" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <Link href="/legal/terms" className="text-accent underline underline-offset-2">
              Terms of Service
            </Link>
            <Link href="/legal/privacy" className="text-accent underline underline-offset-2">
              Privacy Policy
            </Link>
            <Link href="/pricing" className="text-accent underline underline-offset-2">
              Pricing
            </Link>
          </nav>
          <p className="text-xs text-stone-500">
            PinnedAtlas is operated by AutomatedEmpires.
          </p>
        </footer>
      </article>
    </div>
  );
}
