import type { Metadata } from 'next';
import { MapExplorer } from '@/components/map-explorer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore the map — caves, waterfalls & hot springs',
  description:
    'Explore an interactive map of caves, waterfalls, and hot springs. Pan and zoom to find natural wonders near you, with difficulty ratings and community-reported conditions.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  // Map-first landing: the map fills the screen and a listing panel stays synced
  // to the current viewport. Data loads client-side from /api/locations/geojson.
  return <MapExplorer />;
}
