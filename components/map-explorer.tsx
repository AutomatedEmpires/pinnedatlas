'use client';

// Map-first explore experience. The user lands on a full map; a listing panel
// (Zillow-style) stays synced to whatever is in the current map viewport —
// a side column on desktop, a toggleable overlay on mobile.
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
  FEATURE_TYPE_LABELS,
  type DifficultyTier,
  type FeatureType,
  type ModerationStatus,
} from '@/lib/types';
import { Icon } from '@/components/icon';
import { captureEvent } from '@/app/providers';

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SOURCE_ID = 'locations';
const HIGHLIGHT_ID = 'highlight';
const DEFAULT_CENTER: [number, number] = [-105.5, 39.5]; // US mountain west
const DEFAULT_ZOOM = 4.2;
const LIST_CAP = 120; // most panels never need more; count reflects the true total

interface Spot {
  slug: string;
  name: string;
  feature_type: FeatureType;
  difficulty_tier: DifficultyTier;
  moderation_status: ModerationStatus;
  color: string;
  lng: number;
  lat: number;
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

  const [visible, setVisible] = useState<Spot[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const [hovered, setHovered] = useState<string | null>(null);

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
    setVisible(inBounds.slice(0, LIST_CAP));

    // Debounced viewport telemetry: zoom + result count only, no coordinates.
    if (vpTimerRef.current) clearTimeout(vpTimerRef.current);
    const count = inBounds.length;
    vpTimerRef.current = setTimeout(() => {
      captureEvent('viewport_changed', { zoom: Math.round(map.getZoom() * 10) / 10, results: count });
    }, 1000);
  }, []);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
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

  function toggleType(t: FeatureType) {
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      captureEvent('filter_applied', { type: t, active: next.has(t) });
      return next;
    });
  }

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] w-full flex-col lg:flex-row">
      {/* Listing panel: desktop = left column, mobile = overlay toggled by button */}
      <aside
        aria-label="Spots in the current map view"
        className={`absolute inset-0 z-20 flex flex-col bg-surface lg:static lg:z-auto lg:w-[22rem] lg:shrink-0 lg:border-r lg:border-stone-800 ${
          mobileView === 'list' ? 'flex' : 'hidden'
        } lg:flex`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 px-4 py-3">
          <p aria-live="polite" className="text-sm font-medium text-stone-200">
            {loading ? 'Loading spots…' : `${total.toLocaleString()} ${total === 1 ? 'spot' : 'spots'} in view`}
          </p>
          <button
            type="button"
            onClick={() => setMobileView('map')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-surface-overlay px-3 text-sm font-medium text-stone-200 lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="map" size={16} />
            Map
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto overscroll-contain">
          {visible.length === 0 && !loading ? (
            <li className="px-4 py-10 text-center text-sm text-stone-400">
              No spots in this area. Zoom out or pan the map to find caves, waterfalls, and springs.
            </li>
          ) : (
            visible.map((s) => (
              <li key={s.slug} className="border-b border-stone-800/70">
                <Link
                  href={`/location/${s.slug}`}
                  onClick={() => captureEvent('spot_opened', { via: 'list', feature_type: s.feature_type })}
                  onMouseEnter={() => setHovered(s.slug)}
                  onMouseLeave={() => setHovered((h) => (h === s.slug ? null : h))}
                  onFocus={() => setHovered(s.slug)}
                  onBlur={() => setHovered((h) => (h === s.slug ? null : h))}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${s.color}22`, color: s.color }}
                  >
                    <Icon name={s.feature_type} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-100">{s.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400">
                      <span>{FEATURE_TYPE_LABELS[s.feature_type]}</span>
                      <span aria-hidden>·</span>
                      <span>{DIFFICULTY_LABELS[s.difficulty_tier]}</span>
                      {s.moderation_status === 'verified' && (
                        <span className="inline-flex items-center gap-0.5 text-accent">
                          <Icon name="verified" size={12} weight="fill" />
                          Verified
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Map area */}
      <div className="relative h-full w-full lg:flex-1">
        <div
          ref={containerRef}
          role="application"
          aria-label="Interactive map of caves, waterfalls, and springs. A synced list of spots in view is available alongside."
          className="absolute inset-0"
        />

        {/* Top overlay: brand, search, type chips */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface/85 px-3 py-2 text-sm font-semibold tracking-tight backdrop-blur">
              <Icon name="pin" size={16} weight="fill" className="text-accent" />
              PinnedAtlas
            </span>
            <label className="flex flex-1 items-center gap-2 rounded-full bg-surface-raised/90 px-3 py-2 shadow-lg ring-1 ring-stone-700 backdrop-blur focus-within:ring-accent">
              <Icon name="search" size={16} className="shrink-0 text-stone-400" />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search by name…"
                aria-label="Search spots by name"
                className="w-full min-w-0 bg-transparent text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none"
              />
            </label>
          </div>

          <div
            role="group"
            aria-label="Filter by feature type"
            className="pointer-events-auto flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {FEATURE_TYPES.map((t) => {
              const active = types.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  aria-pressed={active}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active
                      ? 'bg-accent-soft text-emerald-50 ring-1 ring-accent'
                      : 'bg-surface-raised/90 text-stone-300 ring-1 ring-stone-700 backdrop-blur hover:text-stone-100'
                  }`}
                >
                  <Icon name={t} size={15} />
                  {FEATURE_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: toggle to the listing panel */}
        <button
          type="button"
          onClick={() => {
            captureEvent('list_opened_mobile', { results: total });
            setMobileView('list');
          }}
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Icon name="list" size={18} />
          {loading ? 'List' : `List · ${total.toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
