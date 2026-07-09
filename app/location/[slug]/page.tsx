import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon, type IconName } from '@/components/icon';
import { ConditionsPanel } from '@/components/location/conditions-panel';
import { GuidancePanel } from '@/components/location/guidance-panel';
import { LocationJsonLd } from '@/components/location/location-jsonld';
import { MiniMapLazy } from '@/components/location/mini-map-lazy';
import { NearbySpots } from '@/components/location/nearby-spots';
import { PhotoGallery } from '@/components/location/photo-gallery';
import { WeatherPanel } from '@/components/location/weather-panel';
import { Reveal } from '@/components/reveal';
import { ReportForm } from '@/components/report-form';
import { ReportList } from '@/components/report-list';
import { SafetyNotice, DEFAULT_SAFETY_COPY } from '@/components/safety-notice';
import { SaveButton } from '@/components/save-button';
import { SaveOfflineButton } from '@/components/save-offline-button';
import { SectionHeading, StatTile, badgeClass, buttonClass, cardClass, cn } from '@/components/ui';
import { getUserId } from '@/lib/auth';
import { getEntitlement, type Entitlement } from '@/lib/billing/entitlements';
import { getLocationBySlug, listReportsForLocation, locationsNear } from '@/lib/db/locations';
import { listMediaForLocation } from '@/lib/db/media';
import { getStatesForUser } from '@/lib/db/user-state';
import { getConditions } from '@/lib/conditions';
import { getGuidance } from '@/lib/guidance';
import { directionsUrl, formatCoords, timeAgo } from '@/lib/geo';
import { getWeather } from '@/lib/weather';
import {
  ACCESS_LABELS,
  DIFFICULTY_LABELS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  MODERATION_LABELS,
  SOURCE_LABELS,
  type FeatureType,
  type LocationRecord,
  type UserLocationState,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

const TYPE_TONE: Record<FeatureType, 'violet' | 'sky' | 'rose' | 'teal' | 'neutral'> = {
  cave: 'violet',
  waterfall: 'sky',
  hot_spring: 'rose',
  spring: 'teal',
  other: 'neutral',
};

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

  const [reports, nearRaw, media, userId, weather, conditions] = await Promise.all([
    listReportsForLocation(location.id),
    locationsNear(location.lat, location.lng, 40000, 8),
    listMediaForLocation(location.id),
    getUserId(),
    getWeather(location.lat, location.lng),
    getConditions({ lat: location.lat, lng: location.lng, feature_type: location.feature_type }),
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

  const heroMedia = media[0] ?? null;
  // Don't repeat the hero image in the gallery strip.
  const galleryMedia = heroMedia ? media.slice(1) : media;

  const facts: { label: string; value: ReactNode; icon: IconName; full?: boolean }[] = [
    { label: 'Type', value: FEATURE_TYPE_LABELS[location.feature_type], icon: location.feature_type },
    { label: 'Difficulty', value: DIFFICULTY_LABELS[location.difficulty_tier], icon: 'compass' },
    { label: 'Effort', value: guidance.effort.label, icon: 'map' },
    { label: 'Best time', value: guidance.bestTime.label, icon: 'compass', full: true },
  ];
  if (location.elevation_m !== null) {
    facts.push({
      label: 'Elevation',
      value: `${location.elevation_m.toLocaleString()} m · ${Math.round(
        location.elevation_m * 3.28084,
      ).toLocaleString()} ft`,
      icon: 'cave',
      full: true,
    });
  }
  facts.push({
    label: 'Coordinates',
    value: <span className="font-mono text-xs">{formatCoords(location.lat, location.lng)}</span>,
    icon: 'pin',
    full: true,
  });

  const badges = (
    <div className="flex flex-wrap items-center gap-2">
      <span className={badgeClass(TYPE_TONE[location.feature_type])}>
        <Icon name={location.feature_type} size={12} weight="fill" />
        {FEATURE_TYPE_LABELS[location.feature_type]}
      </span>
      <span className={badgeClass('neutral')}>{DIFFICULTY_LABELS[location.difficulty_tier]}</span>
      <span className={badgeClass(verified ? 'accent' : 'neutral')}>
        <Icon name={verified ? 'verified' : 'community'} size={12} weight={verified ? 'fill' : 'regular'} />
        {MODERATION_LABELS[location.moderation_status]}
      </span>
      {location.state_code && <span className={badgeClass('neutral')}>{location.state_code}</span>}
    </div>
  );

  return (
    <article className="animate-fade-in">
      {/* Cinematic hero */}
      <header className="relative isolate w-full overflow-hidden">
        {heroMedia ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote user media, full-bleed hero */}
            <img
              src={heroMedia.url}
              alt={location.name}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-surface via-surface/40 to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-surface/60 via-transparent to-transparent"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `linear-gradient(160deg, ${color}59, ${color}12 45%, transparent 72%)`,
            }}
          />
        )}

        <div className="mx-auto flex h-[42vh] max-w-content flex-col justify-between px-4 py-4 sm:h-[52vh] sm:px-6 lg:max-w-wide lg:px-8 lg:py-6">
          <div>
            <Link
              href="/spots"
              className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'glass border-white/15')}
            >
              <Icon name="back" size={16} />
              Browse spots
            </Link>
          </div>

          <div className="max-w-3xl">
            {!heroMedia && (
              <span
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/10"
                style={{ backgroundColor: `${color}26`, color }}
              >
                <Icon name={location.feature_type} size={30} weight="fill" />
              </span>
            )}
            <h1 className="font-display text-3xl font-semibold leading-[1.05] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.55)] sm:text-4xl lg:text-5xl">
              {location.name}
            </h1>
            <div className="mt-3.5">{badges}</div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-10 lg:max-w-wide lg:px-8">
        {/* Live Conditions "Go Score" — the #1 question a visitor has, answered up
            front as a full-width marquee band before the detail grid. */}
        <Reveal className="mb-8 lg:mb-10">
          <ConditionsPanel report={conditions} />
        </Reveal>

        <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
          {/* Intelligence rail — first in DOM so actions/facts/weather sit near the
              top on mobile; pinned to the right column on desktop. */}
          <aside className="lg:col-start-2 lg:row-start-1">
            <div className="space-y-4 lg:sticky lg:top-20">
              {/* Actions */}
              <div className={cardClass({ className: 'p-4' })}>
                <a
                  href={directionsUrl(location.lat, location.lng)}
                  target="_blank"
                  rel="noopener"
                  className={buttonClass({ variant: 'primary', size: 'lg', className: 'w-full' })}
                >
                  <Icon name="directions" size={18} />
                  Directions
                </a>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SaveButton
                    locationId={location.id}
                    initialSaved={Boolean(userState?.saved)}
                    isSignedIn={isSignedIn}
                  />
                  <SaveOfflineButton
                    slug={location.slug}
                    name={location.name}
                    feature_type={location.feature_type}
                    imageUrl={media[0]?.url}
                  />
                </div>
              </div>

              {/* Key facts */}
              <div className={cardClass({ className: 'p-4' })}>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  At a glance
                </span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {facts.map((f) => (
                    <StatTile
                      key={f.label}
                      label={f.label}
                      value={f.value}
                      icon={<Icon name={f.icon} size={13} />}
                      className={f.full ? 'col-span-2' : ''}
                    />
                  ))}
                </div>
              </div>

              {/* Live weather intelligence */}
              <WeatherPanel weather={weather} />
            </div>
          </aside>

          {/* Main content */}
          <div className="mt-8 min-w-0 space-y-12 lg:col-start-1 lg:row-start-1 lg:mt-0">
            {galleryMedia.length > 0 && (
              <Reveal>
                <SectionHeading eyebrow="Gallery" title="More photos" className="mb-4" />
                <PhotoGallery media={galleryMedia} name={location.name} />
              </Reveal>
            )}

            <Reveal className="space-y-8">
              <div>
                <SectionHeading eyebrow="Overview" title="What to expect" className="mb-3" />
                <p className="text-base leading-relaxed text-stone-300 sm:text-lg">
                  {guidance.whatToExpect}
                </p>
              </div>

              {location.description && (
                <div>
                  <SectionHeading eyebrow="Background" title="About this spot" className="mb-3" />
                  <div className={cardClass({ className: 'p-5' })}>
                    <p className="text-sm leading-relaxed text-stone-300 sm:text-base">
                      {location.description}
                    </p>
                    <p className="mt-3 text-xs text-stone-500">
                      Description from {SOURCE_LABELS[location.source]}
                    </p>
                  </div>
                </div>
              )}
            </Reveal>

            <Reveal>
              <SectionHeading eyebrow="Location" title="Where it is" className="mb-4" />
              <MiniMapLazy lat={location.lat} lng={location.lng} color={color} name={location.name} />
              <p className="mt-2.5 flex items-center gap-2 text-xs text-stone-500">
                <Icon name="pin" size={13} className="text-stone-600" />
                <span className="font-mono">{formatCoords(location.lat, location.lng)}</span>
              </p>
            </Reveal>

            <Reveal>
              <GuidancePanel guidance={guidance} featureType={location.feature_type} />
            </Reveal>

            {/* Safety guidance is always shown in full — never behind the paywall. */}
            <Reveal>
              <SectionHeading eyebrow="Stay safe" title="Safety" className="mb-4" />
              <div className="space-y-3">
                <SafetyNotice>
                  <p>{DEFAULT_SAFETY_COPY}</p>
                </SafetyNotice>
                {guidance.safety.length > 0 && (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {guidance.safety.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 rounded-2xl bg-surface-raised p-3.5 text-sm leading-relaxed text-stone-300 hairline"
                      >
                        <Icon name="warning" size={16} className="mt-0.5 shrink-0 text-amber-400/80" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {location.hazard_notes && (
                  <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-medium text-amber-200">
                    {location.hazard_notes}
                  </p>
                )}
                <p className="flex items-center gap-2 text-sm text-stone-400">
                  <Icon name="pin" size={15} className="shrink-0 text-stone-500" />
                  {ACCESS_LABELS[location.access_type]}
                </p>
              </div>
            </Reveal>

            <Reveal>
              <NearbySpots spots={nearby} />
            </Reveal>

            {entitlement?.isPremium && userState?.personal_note && (
              <Reveal>
                <div className={cardClass({ className: 'p-5' })}>
                  <div className="flex items-center gap-2 text-topaz">
                    <Icon name="premium" size={16} weight="fill" />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em]">
                      Your private note
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-300">
                    {userState.personal_note}
                  </p>
                </div>
              </Reveal>
            )}

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
              <span>Source: {SOURCE_LABELS[location.source]}</span>
              <span aria-hidden>·</span>
              <span>Updated {timeAgo(location.updated_at)}</span>
            </p>

            <Reveal>
              <SectionHeading eyebrow="Community" title="Latest conditions" className="mb-4" />
              <div className="space-y-6">
                <ReportList reports={reports} />
                <div className={cardClass({ className: 'p-5' })}>
                  <ReportForm locationId={location.id} isSignedIn={isSignedIn} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      <LocationJsonLd location={location} />
    </article>
  );
}
