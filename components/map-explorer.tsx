'use client';

// Map-first explore experience. The user lands on a full map; a listing panel
// (Zillow-style) stays synced to whatever is in the current map viewport —
// a side column on desktop, a toggleable glass overlay on mobile.
//
// Base map uses MapLibre GL with a free, no-token dark vector style so the map
// always renders. If a Mapbox token is later provided it can be swapped in at
// STYLE_URL without touching the rest of this component.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import maplibregl, { type GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  DIFFICULTY_LABELS,
  FEATURE_TYPES,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_LABELS,
  type DifficultyTier,
  type FeatureType,
  type ModerationStatus,
} from '@/lib/types';
import { Icon } from '@/components/icon';
import { cn } from '@/components/ui';
import { scoreColor, scoreLabel, verdictTone, type ConditionTone } from '@/lib/conditions-ui';
import { formatDistanceKm, haversineKm } from '@/lib/geo';
import { captureEvent } from '@/app/providers';

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SOURCE_ID = 'locations';
const HIGHLIGHT_ID = 'highlight';
const DEFAULT_CENTER: [number, number] = [-105.5, 39.5]; // US mountain west
const DEFAULT_ZOOM = 4.2;
const LIST_CAP = 120; // most panels never need more; count reflects the true total

// Data-driven pin color by Go Score for the "Right Now" mode — mirrors the
// lib/conditions-ui scoreColor buckets so map, detail, and discovery match.
// coalesce(null → 0) keeps unscored pins out of the numeric comparisons and
// lands them on the muted "unrated" stone in the final fallback.
const SCORE_COLOR_EXPRESSION = [
  'case',
  ['>=', ['coalesce', ['get', 'score'], 0], 80],
  '#34d399', // Prime
  ['>=', ['coalesce', ['get', 'score'], 0], 64],
  '#2dd4bf', // Good
  ['>=', ['coalesce', ['get', 'score'], 0], 46],
  '#f5b544', // Fair
  ['>=', ['coalesce', ['get', 'score'], 0], 1],
  '#a8a29e', // Low
  '#57534e', // Unrated (null / 0)
];

// Scored pins pop a touch larger than unrated ones while Right Now is on.
const SCORE_RADIUS_EXPRESSION = ['case', ['>', ['coalesce', ['get', 'score'], 0], 0], 9, 6];

// Feature-type coloring the pin layer restores when Right Now is off.
const TYPE_COLOR_EXPRESSION = ['get', 'color'];

// Legend swatches for the Right Now color key (Prime → Unrated).
const SCORE_LEGEND: ReadonlyArray<{ label: string; color: string }> = [
  { label: 'Prime', color: '#34d399' },
  { label: 'Good', color: '#2dd4bf' },
  { label: 'Fair', color: '#f5b544' },
  { label: 'Low', color: '#a8a29e' },
  { label: 'Unrated', color: '#57534e' },
];

// AA-safe list-chip classes per verdict tone (mirrors components/ui badgeClass).
const CHIP_TONE_CLASS: Record<ConditionTone, string> = {
  accent: 'bg-accent/10 text-accent ring-accent/25',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-500/25',
  topaz: 'bg-topaz/10 text-topaz ring-topaz/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  neutral: 'bg-white/5 text-stone-300 ring-white/10',
};

interface Spot {
  slug: string;
  name: string;
  feature_type: FeatureType;
  difficulty_tier: DifficultyTier;
  moderation_status: ModerationStatus;
  color: string;
  lng: number;
  lat: number;
  // Live "Right Now" conditions carried through from the geojson properties.
  score: number | null;
  verdict: string | null;
}

// A visible spot carries its distance from the current map center, computed at
// recompute time so rows can show a live "how far from here" readout.
interface VisibleSpot extends Spot {
  distanceKm: number;
}

function spotsFromCollection(fc: FeatureCollection): Spot[] {
  const out: Spot[] = [];
  for (const f of fc.features) {
    if (!f.geometry || f.geometry.type !== 'Point') continue;
    const p = f.properties ?? {};
    const [lng, lat] = (f.geometry as Point).coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number') continue;
    out.push({
      slug: String(p.slug),
      name: String(p.name),
      feature_type: p.feature_type as FeatureType,
      difficulty_tier: p.difficulty_tier as DifficultyTier,
      moderation_status: p.moderation_status as ModerationStatus,
      color: String(p.color ?? '#a8a29e'),
      lng,
      lat,
      score: typeof p.score === 'number' ? p.score : null,
      verdict: typeof p.verdict === 'string' ? p.verdict : null,
    });
  }
  return out;
}

export function MapExplorer() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const allSpotsRef = useRef<Spot[]>([]);
  const rawRef = useRef<FeatureCollection>({ type: 'FeatureCollection', features: [] });
  const fetchSeqRef = useRef(0);
  const vpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [visible, setVisible] = useState<VisibleSpot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [hovered, setHovered] = useState<string | null>(null);
  // "Right Now" mode: recolor pins by Go Score + surface what's worth it now.
  const [rightNow, setRightNow] = useState(false);

  // Filter state lives in the component (not the URL) so changing a filter
  // never remounts the map or loses the user's viewport.
  const [types, setTypes] = useState<Set<FeatureType>>(new Set());
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = queryInput.trim();
      setQuery(q);
      // Product analytics only: length, never the raw term or any location.
      if (q) captureEvent('search_used', { length: q.length });
    }, 350);
    return () => clearTimeout(t);
  }, [queryInput]);

  const geojsonUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (types.size > 0 && types.size < FEATURE_TYPES.length) {
      params.set('types', FEATURE_TYPES.filter((t) => types.has(t)).join(','));
    }
    if (query) params.set('q', query);
    const qs = params.toString();
    return `/api/locations/geojson${qs ? `?${qs}` : ''}`;
  }, [types, query]);

  const recomputeVisible = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const c = map.getCenter();
    const inBounds = allSpotsRef.current.filter((s) => b.contains([s.lng, s.lat]));
    inBounds.sort(
      (a, z) =>
        (a.lng - c.lng) ** 2 + (a.lat - c.lat) ** 2 - ((z.lng - c.lng) ** 2 + (z.lat - c.lat) ** 2),
    );
    setTotal(inBounds.length);
    setVisible(
      inBounds.slice(0, LIST_CAP).map((s) => ({
        ...s,
        distanceKm: haversineKm(c.lat, c.lng, s.lat, s.lng),
      })),
    );

    // Debounced viewport telemetry: zoom + result count only, no coordinates.
    if (vpTimerRef.current) clearTimeout(vpTimerRef.current);
    const count = inBounds.length;
    vpTimerRef.current = setTimeout(() => {
      captureEvent('viewport_changed', { zoom: Math.round(map.getZoom() * 10) / 10, results: count });
    }, 1000);
  }, []);

  // Right Now re-sorts the in-view rows by Go Score (nulls last, via -1) so the
  // best-right-now float up. Off keeps recomputeVisible's distance ordering.
  // Array.prototype.sort is stable, so equal-score rows retain distance order.
  const rows = useMemo(() => {
    if (!rightNow) return visible;
    return [...visible].sort((a, z) => (z.score ?? -1) - (a.score ?? -1));
  }, [visible, rightNow]);

  // In-view spots flowing well (Go Score ≥ 64 — Good or better) for the banner.
  const flowingCount = useMemo(
    () => visible.reduce((n, s) => n + ((s.score ?? 0) >= 64 ? 1 : 0), 0),
    [visible],
  );

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      // The CARTO style ships no attribution string; OSM (ODbL) and CARTO both
      // require visible on-map credit, so we supply it explicitly.
      attributionControl: {
        compact: true,
        customAttribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> contributors, <a href="https://carto.com/attributions" target="_blank" rel="noopener">© CARTO</a>',
      },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-right',
    );

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: rawRef.current,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#34d399',
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 22, 100, 28],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#0c0a09',
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Metropolis Bold', 'Noto Sans Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#0c0a09' },
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Highlight layer for the list-hovered spot (own source, above points).
      map.addSource(HIGHLIGHT_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'highlight-ring',
        type: 'circle',
        source: HIGHLIGHT_ID,
        paint: {
          'circle-radius': 12,
          'circle-color': '#34d399',
          'circle-opacity': 0.25,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#34d399',
        },
      });

      map.on('click', 'clusters', (e) => {
        const feat = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const clusterId = feat?.properties?.cluster_id as number | undefined;
        const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (clusterId === undefined || !src || feat.geometry.type !== 'Point') return;
        void src.getClusterExpansionZoom(clusterId).then((zoom) => {
          map.easeTo({ center: (feat.geometry as Point).coordinates as [number, number], zoom });
        });
      });

      map.on('click', 'unclustered-point', (e) => {
        const props = e.features?.[0]?.properties as
          | { slug?: string; feature_type?: string }
          | undefined;
        if (props?.slug) {
          captureEvent('spot_opened', { via: 'map', feature_type: props.feature_type });
          router.push(`/location/${props.slug}`);
        }
      });

      for (const layer of ['clusters', 'unclustered-point']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }

      map.on('moveend', recomputeVisible);

      loadedRef.current = true;
      (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(rawRef.current);
      recomputeVisible();
      captureEvent('map_opened');
    });

    return () => {
      loadedRef.current = false;
      fetchSeqRef.current += 1;
      map.remove();
      mapRef.current = null;
    };
    // router/recomputeVisible are stable; init must run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch (and refetch on filter change) the location data.
  useEffect(() => {
    const seq = ++fetchSeqRef.current;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(geojsonUrl);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as FeatureCollection;
        if (cancelled || seq !== fetchSeqRef.current) return;
        rawRef.current = data;
        allSpotsRef.current = spotsFromCollection(data);
        if (loadedRef.current) {
          (mapRef.current?.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(data);
          recomputeVisible();
        }
      } catch {
        if (!cancelled && seq === fetchSeqRef.current) {
          rawRef.current = { type: 'FeatureCollection', features: [] };
          allSpotsRef.current = [];
          setVisible([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled && seq === fetchSeqRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl, recomputeVisible]);

  // Drive the highlight source from the hovered list card.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const src = map.getSource(HIGHLIGHT_ID) as GeoJSONSource | undefined;
    if (!src) return;
    const spot = hovered ? allSpotsRef.current.find((s) => s.slug === hovered) : null;
    src.setData({
      type: 'FeatureCollection',
      features: spot
        ? [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [spot.lng, spot.lat] } }]
        : [],
    });
  }, [hovered]);

  // Repaint the existing pin layer when Right Now toggles — data-driven Go Score
  // colors + a slightly larger scored radius when on, feature-type colors when
  // off. Mutates paint on the live layer; never rebuilds the map or source.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || !map.getLayer('unclustered-point')) return;
    if (rightNow) {
      map.setPaintProperty('unclustered-point', 'circle-color', SCORE_COLOR_EXPRESSION);
      map.setPaintProperty('unclustered-point', 'circle-radius', SCORE_RADIUS_EXPRESSION);
    } else {
      map.setPaintProperty('unclustered-point', 'circle-color', TYPE_COLOR_EXPRESSION);
      map.setPaintProperty('unclustered-point', 'circle-radius', 7);
    }
  }, [rightNow]);

  function toggleType(t: FeatureType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      captureEvent('filter_applied', { type: t, active: next.has(t) });
      return next;
    });
  }

  function toggleRightNow() {
    setRightNow((on) => {
      const next = !on;
      captureEvent('right_now_toggled', { active: next });
      return next;
    });
  }

  const countLabel = total === 1 ? 'spot' : 'spots';

  return (
    // Fill the shell between the fixed navs: mobile leaves room for the bottom
    // tab bar (4rem), desktop for the top nav (3.5rem).
    <div className="relative flex h-[calc(100dvh-4rem)] w-full flex-col md:h-[calc(100dvh-3.5rem)] md:flex-row">
      {/* Listing panel: desktop = static left column, mobile = glass overlay toggled by button */}
      <aside
        aria-label="Spots in the current map view"
        className={cn(
          'z-20 flex-col md:static md:z-auto md:flex md:w-[22rem] md:shrink-0 md:border-r md:border-white/8 lg:w-[24rem]',
          'absolute inset-0 glass',
          mobileView === 'list' ? 'flex' : 'hidden',
        )}
      >
        {/* Bottom-sheet grabber — a mobile affordance for the overlay. */}
        <div className="flex justify-center pt-2.5 md:hidden" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3.5 md:px-5">
          <p aria-live="polite" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums text-stone-50">
              {loading ? '—' : total.toLocaleString()}
            </span>
            <span className="truncate text-sm text-stone-400">
              {loading ? 'finding spots…' : `${countLabel} in view`}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-stone-200 transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
          >
            <Icon name="map" size={16} />
            Map
          </button>
        </div>

        {/* Right Now banner: a punchy, editorial read on what's worth it now. */}
        {rightNow && (
          <div className="border-b border-white/8 bg-accent/[0.06] px-4 py-2.5 md:px-5">
            <p aria-live="polite" className="font-display text-sm font-semibold tracking-tight text-accent">
              {loading
                ? 'Reading live conditions…'
                : flowingCount > 0
                  ? `${flowingCount} flowing well nearby`
                  : 'No live scores in view yet.'}
            </p>
          </div>
        )}

        <ul className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-2 md:p-2.5">
          {loading && rows.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                <span className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/[0.05]" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
                  <span className="block h-2.5 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                </span>
              </li>
            ))
          ) : rows.length === 0 ? (
            <li className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-stone-500 ring-1 ring-inset ring-white/10">
                <Icon name="compass" size={26} />
              </span>
              <p className="max-w-[15rem] text-sm leading-relaxed text-stone-400">
                No spots in this view. Zoom out or pan the map to find caves, waterfalls, and
                springs.
              </p>
            </li>
          ) : (
            rows.map((s) => {
              const active = hovered === s.slug;
              const isVerified = s.moderation_status === 'verified';
              // Show the Go Score chip when a spot is scored, or always in
              // Right Now mode (so unrated spots read as an explicit "Unrated").
              const showScore = s.score != null || rightNow;
              return (
                <li key={s.slug}>
                  <Link
                    href={`/location/${s.slug}`}
                    onClick={() =>
                      captureEvent('spot_opened', { via: 'list', feature_type: s.feature_type })
                    }
                    onMouseEnter={() => setHovered(s.slug)}
                    onMouseLeave={() => setHovered((h) => (h === s.slug ? null : h))}
                    onFocus={() => setHovered(s.slug)}
                    onBlur={() => setHovered((h) => (h === s.slug ? null : h))}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-all duration-200 ease-spring',
                      'hover:-translate-y-px hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      active && 'bg-white/[0.06] ring-1 ring-inset ring-accent/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
                      style={{ backgroundColor: `${s.color}1f`, color: s.color }}
                    >
                      <Icon name={s.feature_type} size={20} weight="fill" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-stone-50">
                        {s.name}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] leading-none text-stone-400">
                        <span className="font-medium" style={{ color: s.color }}>
                          {FEATURE_TYPE_LABELS[s.feature_type]}
                        </span>
                        <span aria-hidden className="text-stone-600">
                          ·
                        </span>
                        <span>{DIFFICULTY_LABELS[s.difficulty_tier]}</span>
                        {isVerified && (
                          <span className="inline-flex items-center gap-0.5 text-accent">
                            <Icon name="verified" size={12} weight="fill" />
                            Verified
                          </span>
                        )}
                        {showScore && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-[3px] font-semibold ring-1 ring-inset',
                              CHIP_TONE_CLASS[verdictTone(s.verdict)],
                            )}
                          >
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: scoreColor(s.score) }}
                            />
                            {s.verdict ?? scoreLabel(s.score)}
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="shrink-0 self-center text-xs font-medium tabular-nums text-stone-400 transition-colors group-hover:text-stone-200">
                      {formatDistanceKm(s.distanceKm)}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      {/* Map area */}
      <div className="relative h-full w-full md:flex-1">
        <div
          ref={containerRef}
          role="application"
          aria-label="Interactive map of caves, waterfalls, and springs. A synced list of spots in view is available alongside."
          className="absolute inset-0"
        />

        {/* Top overlay: brand (mobile), search pill, feature-type filter chips.
            The container is click-through; only the pills capture pointer events
            so the map stays pannable in the gaps. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2.5 p-3 md:p-4">
          <div className="flex items-center gap-2.5">
            {/* Desktop has a top nav wordmark already; show it here on mobile only. */}
            <span className="glass pointer-events-auto flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 shadow-float ring-1 ring-inset ring-white/10 md:hidden">
              <Icon name="pin" size={16} weight="fill" className="text-accent" />
              <span className="font-display text-base font-semibold tracking-tight text-stone-50">
                PinnedAtlas
              </span>
            </span>

            <label className="glass pointer-events-auto flex min-h-11 flex-1 items-center gap-2 rounded-full px-4 shadow-float ring-1 ring-inset ring-white/10 transition-all duration-200 focus-within:shadow-glow focus-within:ring-accent md:max-w-sm">
              <Icon name="search" size={16} className="shrink-0 text-stone-400" />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search by name…"
                aria-label="Search spots by name"
                className="w-full min-w-0 bg-transparent text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={() => setQueryInput('')}
                  aria-label="Clear search"
                  className="flex shrink-0 items-center justify-center rounded-full p-1 text-stone-500 transition-colors hover:text-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* Right Now — the marquee live-conditions toggle. Pinned left of the
                scrolling filter chips so it stays in reach. Default off; when on,
                pins recolor by Go Score and the list surfaces what's worth it now. */}
            <button
              type="button"
              onClick={toggleRightNow}
              aria-pressed={rightNow}
              aria-label="Right Now — score spots by live conditions"
              className={cn(
                'pointer-events-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ring-1 ring-inset transition-all duration-200 ease-spring active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                rightNow
                  ? 'bg-accent text-stone-950 ring-accent shadow-glow'
                  : 'glass text-stone-200 ring-white/10 hover:text-stone-100 hover:ring-white/20',
              )}
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                {rightNow && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-stone-950/50" />
                )}
                <span
                  className={cn(
                    'relative inline-flex h-2 w-2 rounded-full',
                    rightNow ? 'bg-stone-950' : 'bg-accent',
                  )}
                />
              </span>
              Right Now
            </button>

            <div
              role="group"
              aria-label="Filter by feature type"
              className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {FEATURE_TYPES.map((t) => {
                const active = types.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    aria-pressed={active}
                    className={cn(
                      'pointer-events-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium ring-1 ring-inset transition-all duration-200 ease-spring active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      active
                        ? 'bg-accent/15 text-accent ring-accent/60'
                        : 'glass text-stone-300 ring-white/10 hover:text-stone-100 hover:ring-white/20',
                    )}
                  >
                    <span
                      className="flex"
                      style={active ? undefined : { color: FEATURE_TYPE_COLORS[t] }}
                    >
                      <Icon name={t} size={15} weight="fill" />
                    </span>
                    {FEATURE_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color key for Right Now — a subtle caption tying pin colors to the
              Go Score verdicts. Informational, so it lets map gestures pass through. */}
          {rightNow && (
            <div className="flex">
              <div className="glass pointer-events-none flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full px-3 py-1.5 text-[11px] font-medium text-stone-300 shadow-float ring-1 ring-inset ring-white/10">
                <span className="text-stone-400">Go Score</span>
                {SCORE_LEGEND.map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile: toggle to the listing panel. Bottom-center keeps it clear of
            the map controls at bottom-right. */}
        <button
          type="button"
          onClick={() => {
            captureEvent('list_opened_mobile', { results: total });
            setMobileView('list');
          }}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-stone-950 shadow-[0_10px_30px_-8px_rgba(52,211,153,0.6)] transition-all duration-200 ease-spring hover:bg-accent-strong active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
        >
          <Icon name="list" size={18} weight="bold" />
          {loading ? 'List' : `List · ${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
