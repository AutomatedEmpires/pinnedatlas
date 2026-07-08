import type { MetadataRoute } from 'next';
import { env, hasSupabase } from '@/lib/env';
import { listLocationSlugs } from '@/lib/db/locations';

const STATIC_PATHS = ['/', '/spots', '/pricing', '/about', '/legal/terms', '/legal/privacy'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.appUrl.replace(/\/$/, '');

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? `${base}/` : `${base}${path}`,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));

  if (!hasSupabase) return staticEntries;

  try {
    // Google allows 50k URLs per sitemap; include every public location so no
    // detail page is orphaned from crawl discovery.
    const locations = await listLocationSlugs();
    const locationEntries: MetadataRoute.Sitemap = locations.map((location) => ({
      url: `${base}/location/${location.slug}`,
      lastModified: new Date(location.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...staticEntries, ...locationEntries];
  } catch {
    // A sitemap must never take the site down with it — fall back to statics.
    return staticEntries;
  }
}
