import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { ReportForm } from '@/components/report-form';
import { ReportList } from '@/components/report-list';
import { SafetyNotice, DEFAULT_SAFETY_COPY } from '@/components/safety-notice';
import { SaveButton } from '@/components/save-button';
import { getUserId } from '@/lib/auth';
import { getEntitlement, type Entitlement } from '@/lib/billing/entitlements';
import { getLocationBySlug, listReportsForLocation } from '@/lib/db/locations';
import { getStatesForUser } from '@/lib/db/user-state';
import { directionsUrl, formatCoords, timeAgo } from '@/lib/geo';
import {
  ACCESS_LABELS,
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  MODERATION_LABELS,
  SOURCE_LABELS,
  type UserLocationState,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const BADGE = 'rounded bg-stone-800/80 px-1.5 py-0.5 text-stone-300';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) return { title: 'Location not found' };

  const description =
    location.description ??
    `${FEATURE_TYPE_LABELS[location.feature_type]}${
      location.state_code ? ` in ${location.state_code}` : ''
    } — coordinates, difficulty, access notes, and current conditions on PinnedAtlas.`;

  return {
    title: location.name,
    description,
    openGraph: {
      title: location.name,
      description,
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();

  const [reports, userId] = await Promise.all([
    listReportsForLocation(location.id),
    getUserId(),
  ]);

  let userState: UserLocationState | null = null;
  let entitlement: Entitlement | null = null;
  if (userId) {
    const [states, ent] = await Promise.all([
      getStatesForUser(userId, [location.id]),
      getEntitlement(userId),
    ]);
    userState = states[0] ?? null;
    entitlement = ent;
  }

  const isSignedIn = Boolean(userId);
  const color = FEATURE_TYPE_COLORS[location.feature_type];
  const verified = location.moderation_status === 'verified';

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-4">
      <Link
        href="/spots"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-stone-400 hover:text-stone-200"
      >
        <Icon name="back" size={16} />
        Browse spots
      </Link>

      <header
        className="mt-2 rounded-xl bg-surface-raised p-5"
        // 33 = 20% alpha; type-colored wash fading into the raised surface.
        style={{ backgroundImage: `linear-gradient(150deg, ${color}33, transparent 70%)` }}
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}33`, color }}
        >
          <Icon name={location.feature_type} size={30} />
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-stone-100">{location.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className={BADGE}>{FEATURE_TYPE_LABELS[location.feature_type]}</span>
          <span className={BADGE}>{DIFFICULTY_LABELS[location.difficulty_tier]}</span>
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
              verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-800/80 text-stone-400'
            }`}
          >
            <Icon name={verified ? 'verified' : 'community'} size={12} weight={verified ? 'fill' : 'regular'} />
            {MODERATION_LABELS[location.moderation_status]}
          </span>
          {location.state_code && <span className={BADGE}>{location.state_code}</span>}
        </div>
      </header>

      <div className="mt-4 space-y-6">
        {/* Safety guidance is always shown in full — never behind the paywall. */}
        <SafetyNotice>
          <p>{DEFAULT_SAFETY_COPY}</p>
          {location.hazard_notes && (
            <p className="mt-2 font-medium text-amber-200">{location.hazard_notes}</p>
          )}
          <p className="mt-2">{ACCESS_LABELS[location.access_type]}</p>
        </SafetyNotice>

        {location.description && (
          <section aria-label="Description">
            <p className="text-sm leading-relaxed text-stone-300">{location.description}</p>
          </section>
        )}

        {(location.elevation_m !== null ||
          location.season_notes ||
          location.difficulty_notes) && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Details
            </h2>
            <dl className="mt-2 grid grid-cols-1 gap-3 rounded-xl bg-surface-raised p-4 text-sm">
              {location.elevation_m !== null && (
                <div>
                  <dt className="text-xs text-stone-500">Elevation</dt>
                  <dd className="mt-0.5 text-stone-200">
                    {location.elevation_m.toLocaleString()} m (
                    {Math.round(location.elevation_m * 3.28084).toLocaleString()} ft)
                  </dd>
                </div>
              )}
              {location.season_notes && (
                <div>
                  <dt className="text-xs text-stone-500">Season</dt>
                  <dd className="mt-0.5 text-stone-200">{location.season_notes}</dd>
                </div>
              )}
              {location.difficulty_notes && (
                <div>
                  <dt className="text-xs text-stone-500">Difficulty</dt>
                  <dd className="mt-0.5 text-stone-200">{location.difficulty_notes}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section aria-label="Coordinates" className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Coordinates
            </h2>
            <p className="mt-0.5 font-mono text-sm text-stone-200">
              {formatCoords(location.lat, location.lng)}
            </p>
          </div>
          <a
            href={directionsUrl(location.lat, location.lng)}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="directions" size={18} />
            Directions
          </a>
        </section>

        <SaveButton
          locationId={location.id}
          initialSaved={Boolean(userState?.saved)}
          isSignedIn={isSignedIn}
        />

        {entitlement?.isPremium && userState?.personal_note && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Your note
            </h2>
            <p className="mt-2 rounded-xl bg-surface-raised p-4 text-sm leading-relaxed text-stone-300">
              {userState.personal_note}
            </p>
          </section>
        )}

        <p className="text-xs text-stone-500">
          Source: {SOURCE_LABELS[location.source]} · Updated {timeAgo(location.updated_at)}
        </p>

        <section aria-label="Latest conditions">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Latest conditions
          </h2>
          <div className="mt-3">
            <ReportList reports={reports} />
          </div>
          <div className="mt-4">
            <ReportForm locationId={location.id} isSignedIn={isSignedIn} />
          </div>
        </section>
      </div>
    </div>
  );
}
