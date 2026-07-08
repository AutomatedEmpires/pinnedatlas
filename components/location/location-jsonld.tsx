import { env } from '@/lib/env';
import { FEATURE_TYPE_LABELS, type LocationRecord } from '@/lib/types';

/**
 * schema.org TouristAttraction JSON-LD for a location. The serialized JSON is
 * sanitized (every `<` escaped) before injection to prevent script-context
 * breakout from any user-influenced field.
 */
export function LocationJsonLd({ location }: { location: LocationRecord }) {
  const description =
    location.description ??
    `${FEATURE_TYPE_LABELS[location.feature_type]}${
      location.state_code ? ` in ${location.state_code}` : ''
    } — details, difficulty, access notes, and current conditions on PinnedAtlas.`;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: location.name,
    description,
    url: `${env.appUrl}/location/${location.slug}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    },
  };

  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
