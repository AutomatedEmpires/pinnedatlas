import type { Metadata } from 'next';
import Link from 'next/link';
import { getUserId } from '@/lib/auth';
import { FREE_SAVE_LIMIT, getEntitlement } from '@/lib/billing/entitlements';
import { countSaves, getSavedLocations, type SavedLocation } from '@/lib/db/user-state';
import { Icon } from '@/components/icon';
import { LocationCard } from '@/components/location-card';
import { SpotControls } from '@/components/spot-controls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'My Spots' };

// Show the upgrade nudge once a free user has used this many saves.
const UPSELL_AT = 7;

type Tab = 'saved' | 'visited';

export default async function MySpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const userId = await getUserId();

  if (!userId) {
    return (
      <div className="mx-auto w-full max-w-shell px-4 py-8">
        <h1 className="text-2xl font-semibold">My Spots</h1>
        <section className="mt-6 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
          <div className="flex justify-center text-stone-500">
            <Icon name="save" size={32} />
          </div>
          <p className="mt-3 text-sm text-stone-300">
            Save spots you want to visit, log the ones you have been to, and keep personal
            notes — all in one place.
          </p>
          <Link
            href="/sign-in"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-stone-950 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Sign in
          </Link>
        </section>
      </div>
    );
  }

  const params = await searchParams;
  const tab: Tab = params.tab === 'visited' ? 'visited' : 'saved';

  const [rows, entitlement, savesUsed] = await Promise.all([
    getSavedLocations(userId),
    getEntitlement(userId),
    countSaves(userId),
  ]);

  const savedRows = rows.filter((row) => row.saved);
  const visitedRows = rows.filter((row) => row.visited);
  const saveLimit = entitlement.saveLimit ?? FREE_SAVE_LIMIT;

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-2xl font-semibold">My Spots</h1>
        {entitlement.isPremium ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
            <Icon name="premium" size={14} weight="fill" />
            Premium
          </span>
        ) : (
          <p className="text-sm text-stone-400">
            {savesUsed} of {saveLimit} saves used
            {savesUsed >= UPSELL_AT && (
              <>
                {' · '}
                <Link
                  href="/pricing"
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  Go unlimited
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      <nav
        aria-label="My Spots sections"
        className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-stone-800 bg-surface-raised p-1"
      >
        <TabLink href="/my?tab=saved" active={tab === 'saved'}>
          Saved ({savedRows.length})
        </TabLink>
        <TabLink href="/my?tab=visited" active={tab === 'visited'}>
          {entitlement.isPremium ? `Visited (${visitedRows.length})` : 'Visited'}
        </TabLink>
      </nav>

      {tab === 'saved' ? (
        savedRows.length === 0 ? (
          <EmptyState
            icon="save"
            heading="Nothing saved yet"
            copy="Tap the bookmark on any cave, waterfall, or hot spring to keep it here."
          />
        ) : (
          <SpotList rows={savedRows} isPremium={entitlement.isPremium} />
        )
      ) : !entitlement.isPremium ? (
        <section className="mt-6 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
          <div className="flex justify-center text-accent">
            <Icon name="premium" size={32} weight="fill" />
          </div>
          <h2 className="mt-3 text-lg font-semibold">Visited tracking is Premium</h2>
          <p className="mt-2 text-sm text-stone-300">
            Log everywhere you have been and keep personal notes on any spot with Atlas
            Premium.
          </p>
          <Link
            href="/pricing"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-stone-950 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            See Premium plans
          </Link>
        </section>
      ) : visitedRows.length === 0 ? (
        <EmptyState
          icon="visited"
          heading="No visits logged yet"
          copy="Mark a spot as visited to build your trip log."
        />
      ) : (
        <SpotList rows={visitedRows} isPremium={entitlement.isPremium} />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center justify-center rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        active ? 'bg-surface-overlay text-stone-100' : 'text-stone-400 hover:text-stone-200'
      }`}
    >
      {children}
    </Link>
  );
}

function SpotList({ rows, isPremium }: { rows: SavedLocation[]; isPremium: boolean }) {
  return (
    <ul className="mt-5 space-y-5">
      {rows.map((row) => (
        <li key={row.location_id}>
          <LocationCard location={row.location} />
          <SpotControls
            locationId={row.location_id}
            saved={row.saved}
            visited={row.visited}
            personalNote={row.personal_note}
            isPremium={isPremium}
          />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  icon,
  heading,
  copy,
}: {
  icon: 'save' | 'visited';
  heading: string;
  copy: string;
}) {
  return (
    <section className="mt-6 rounded-xl border border-stone-800 bg-surface-raised p-6 text-center">
      <div className="flex justify-center text-stone-500">
        <Icon name={icon} size={32} />
      </div>
      <h2 className="mt-3 text-lg font-semibold">{heading}</h2>
      <p className="mt-2 text-sm text-stone-300">{copy}</p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-accent px-6 text-sm font-semibold text-stone-950 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Icon name="compass" size={16} />
        Explore the map
      </Link>
    </section>
  );
}
