'use client';

// Small, static locator map for a single spot. Cooperative in-page scroll-zoom
// feels bad, so scrollZoom is disabled while drag and the zoom buttons stay.

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function MiniMap({
  lat,
  lng,
  color,
  name,
}: {
  lat: number;
  lng: number;
  color: string;
  name: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    // Guard against double-init (StrictMode / re-render).
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [lng, lat],
      zoom: 11,
      // The CARTO style ships no attribution string; OSM (ODbL) and CARTO both
      // require visible on-map credit, so we supply it explicitly.
      attributionControl: {
        compact: true,
        customAttribution:
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a> contributors, <a href="https://carto.com/attributions" target="_blank" rel="noopener">© CARTO</a>',
      },
    });
    mapRef.current = map;

    map.scrollZoom.disable();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    new maplibregl.Marker({ color }).setLngLat([lng, lat]).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Location is fixed for the life of the page; initialize exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={`Map showing the location of ${name}`}
      className="h-[200px] w-full overflow-hidden rounded-xl"
    />
  );
}
