'use client';

// Mapbox GL wrapper for the home explore screen. Renders clustered location
// pins from a GeoJSON endpoint; clicking a pin navigates to its detail page.

import { useEffect, useRef } from 'react';
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
import type { Feature } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

const SOURCE_ID = 'locations';
const DEFAULT_CENTER: [number, number] = [-105.5, 39.5]; // US mountain west
const DEFAULT_ZOOM = 5;

export function MapView({ token, geojsonUrl }: { token: string; geojsonUrl: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sourceReadyRef = useRef(false);
  // Latest URL + fetch sequence so the initial load and rapid filter changes
  // never apply stale data over newer data.
  const urlRef = useRef(geojsonUrl);
  const fetchSeqRef = useRef(0);
  urlRef.current = geojsonUrl;

  useEffect(() => {
    // Guard against double-init (React strict mode invokes effects twice).
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    mapRef.current = map;

    // Bottom-left keeps controls clear of the top search/filter overlay and
    // the bottom-right "Browse list" button.
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-left');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'bottom-left',
    );

    const applyData = async (url: string) => {
      const seq = ++fetchSeqRef.current;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (seq !== fetchSeqRef.current) return; // a newer fetch superseded this one
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        source?.setData(data);
      } catch {
        // Network hiccup: keep whatever data is already on the map.
      }
    };

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 50,
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
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#0c0a09',
        },
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

      map.on('click', 'clusters', (e) => {
        const feature = e.features?.[0] as Feature | undefined;
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        if (!feature || clusterId === undefined || !source || feature.geometry.type !== 'Point') {
          return;
        }
        const center = feature.geometry.coordinates as [number, number];
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || typeof zoom !== 'number') return;
          map.easeTo({ center, zoom });
        });
      });

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0] as Feature | undefined;
        const slug = feature?.properties?.slug as string | undefined;
        if (slug) window.location.href = `/location/${slug}`;
      });

      for (const layer of ['clusters', 'unclustered-point']) {
        map.on('mouseenter', layer, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = '';
        });
      }

      sourceReadyRef.current = true;
      // urlRef always holds the latest prop, even if it changed before load.
      void applyData(urlRef.current);
    });

    return () => {
      sourceReadyRef.current = false;
      fetchSeqRef.current += 1; // invalidate any in-flight fetch
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Re-fetch and swap data when the filter query (geojsonUrl) changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReadyRef.current) return; // initial load handled by 'load' handler
    const seq = ++fetchSeqRef.current;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(geojsonUrl);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || seq !== fetchSeqRef.current) return;
        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
        source?.setData(data);
      } catch {
        // Keep the previous data on fetch failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Interactive map of caves, waterfalls, and springs"
      className="h-full w-full"
    />
  );
}
