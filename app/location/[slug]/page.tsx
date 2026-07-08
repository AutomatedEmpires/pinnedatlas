import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/icon';
import { GuidancePanel } from '@/components/location/guidance-panel';
import { LocationJsonLd } from '@/components/location/location-jsonld';
import { MiniMapLazy } from '@/components/location/mini-map-lazy';
import { NearbySpots } from '@/components/location/nearby-spots';
import { PhotoGallery } from '@/components/location/photo-gallery';
import { ReportForm } from '@/components/report-form';
import { ReportList } from '@/components/report-list';
import { SafetyNotice, DEFAULT_SAFETY_COPY } from '@/components/safety-notice';
import { SaveButton } from '@/components/save-button';
import { getUserId } from '@/lib/auth';
import { getEntitlement, type Entitlement } from '@/lib/billing/entitlements';
import { getLocationBySlug, listReportsForLocation, locationsNear } from '@/lib/db/locations';
import { listMediaForLocation } from '@/lib/db/media';
import { getStatesForUser } from '@/lib/db/user-state';
import { getGuidance } from '@/lib/guidance';
import { directionsUrl, formatCoords, timeAgo } from '@/lib/geo';
import {
  ACCESS_LABELS,
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  MODERATION_LABELS,
  SOURCE_LABELS,
  type LocationRecord,
  type UserLocationState,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const BADGE = 'rounded bg-stone-800/80 px-1.5 py-0.5 text-stone-300';
const SECTION_HEADING = 'text-xs font-semibold uppercase tracking-wide text-stone-500';

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

  const canonical = `/location/${location.slug}`;
  return {
    title: location.name,
    description,
    alternates: { canonical },
    openGraph: {
      title: location.name,
      description,
      url: canonical,
      type: 'article',
    },
  };
}

type NearRow = LocationRecord & { distance_m: number };

interface NearbyShape {
  slug: string;
  name: string;
  feature_type: LocationRecord['feature_type'];
  difficulty_tier: LocationRecord['difficulty_tier'];
  distance_m: number;
}

function toNearby(rows: NearRow[], excludeId: string, excludeSlug: string): NearbyShape[] {
  return rows
    .filter((r) => r.id !== excludeId && r.slug !== excludeSlug)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      feature_type: r.feature_type,
      difficulty_tier: r.difficulty_tier,
      distance_m: r.distance_m,
    }));
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();

  const [reports, nearRaw, media, userId] = await Promise.all([
    listReportsForLocation(location.id),
    locationsNear(location.lat, location.lng, 40000, 8),
    listMediaForLocation(location.id),
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

  // Prefer close-by spots; widen the search only when the immediate area is thin.
  let nearby = toNearby(nearRaw, location.id, location.slug).slice(0, 6);
  if (nearby.length < 3) {
    const wider = await locationsNear(location.lat, location.lng, 150000, 8);
    nearby = toNearby(wider, location.id, location.slug).slice(0, 6);
  }

  const isSignedIn = Boolean(userId);
  const color = FEATURE_TYPE_COLORS[location.feature_type];
  const verified = location.moderation_status === 'verified';
  const guidance = getGuidance(location);

  const facts: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Type', value: FEATURE_TYPE_LABELS[location.feature_type] },
    { label: 'Difficulty', value: DIFFICULTY_LABELS[location.difficulty_tier] },
    { label: 'Effort', value: guidance.effort.label },
    { label: 'Best time', value: guidance.bestTime.label },
  ];
  if (location.elevation_m !== null) {
    facts.push({
      label: 'Elevation',
      value: `${location.elevation_m.toLocaleString()} m · ${Math.round(
        location.elevation_m * 3.28084,
      ).toLocaleString()} ft`,
    });
  }
  facts.push({
    label: 'Coordinates',
    value: formatCoords(location.lat, location.lng),
    mono: true,
  });

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
        className="mt-2 overflow-hidden rounded-xl bg-surface-raised p-5"
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
            <Icon
              name={verified ? 'verified' : 'community'}
              size={12}
              weight={verified ? 'fill' : 'regular'}
            />
            {MODERATION_LABELS[location.moderation_status]}
          </span>
          {location.state_code && <span className={BADGE}>{location.state_code}</span>}
        </div>
      </header>

      <div className="mt-4 space-y-6">
        <PhotoGallery media={media} name={location.name} />

        {/* Primary actions: the two things a visitor is most likely to want. */}
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={directionsUrl(location.lat, location.lng)}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-stone-950 transition-colors hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-none"
          >
            <Icon name="directions" size={18} />
            Directions
          </a>
          <SaveButton
            locationId={location.id}
            initialSaved={Boolean(userState?.saved)}
            isSignedIn={isSignedIn}
          />
        </div>

        <section aria-label="What to expect">
          <h2 className={SECTION_HEADING}>What to expect</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-300">{guidance.whatToExpect}</p>
        </section>

        {location.description && (
          <section aria-label="About this spot">
            <h2 className={SECTION_HEADING}>About this spot</h2>
            <p className="mt-2 rounded-xl bg-surface-raised p-4 text-sm leading-relaxed text-stone-300">
              {location.description}
            </p>
            <p className="mt-1.5 text-xs text-stone-500">From {SOURCE_LABELS[location.source]}</p>
          </section>
        )}

        <section aria-label="Key facts">
          <h2 className={SECTION_HEADING}>Key facts</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl bg-surface-raised p-3">
                <dt className="text-xs text-stone-500">{f.label}</dt>
                <dd
                  className={`mt-0.5 text-sm text-stone-100 ${f.mono ? 'font-mono' : 'font-medium'}`}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Where it is">
          <h2 className={SECTION_HEADING}>Where it is</h2>
          <div className="mt-3">
            <MiniMapLazy lat={location.lat} lng={location.lng} color={color} name={location.name} />
          </div>
        </section>

        <GuidancePanel guidance={guidance} featureType={location.feature_type} />

        {/* Safety guidance is always shown in full — never behind the paywall. */}
        <section aria-label="Safety" className="space-y-3">
          <h2 className={SECTION_HEADING}>Safety</h2>
          <SafetyNotice>
            <p>{DEFAULT_SAFETY_COPY}</p>
          </SafetyNotice>
          {guidance.safety.length > 0 && (
            <ul className="space-y-2">
              {guidance.safety.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-stone-300">
                  <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-amber-400/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {location.hazard_notes && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm font-medium text-amber-200">
              {location.hazard_notes}
            </p>
          )}
          <p className="text-sm text-stone-400">{ACCESS_LABELS[location.access_type]}</p>
        </section>

        <NearbySpots spots={nearby} />

        {entitlement?.isPremium && userState?.personal_note && (
          <section aria-label="Your note">
            <h2 className={SECTION_HEADING}>Your note</h2>
            <p className="mt-2 rounded-xl bg-surface-raised p-4 text-sm leading-relaxed text-stone-300">
              {userState.personal_note}
            </p>
          </section>
        )}

        <p className="text-xs text-stone-500">
          Source: {SOURCE_LABELS[location.source]} · Updated {timeAgo(location.updated_at)}
        </p>

        <section aria-label="Latest conditions">
          <h2 className={SECTION_HEADING}>Latest conditions</h2>
          <div className="mt-3">
            <ReportList reports={reports} />
          </div>
          <div className="mt-4">
            <ReportForm locationId={location.id} isSignedIn={isSignedIn} />
          </div>
        </section>
      </div>

      <LocationJsonLd location={location} />
    </div>
  );
}
