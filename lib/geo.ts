// Pure geo/text helpers shared by app code, API routes, and ingestion scripts.

export function slugify(name: string, stateCode?: string | null): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return stateCode ? `${base}-${stateCode.toLowerCase()}` : base;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistanceKm(km: number): string {
  const miles = km * 0.621371;
  if (miles < 0.2) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function directionsUrl(lat: number, lng: number): string {
  // Universal Google Maps directions link; opens the native app on mobile.
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Reports older than this are considered stale and de-emphasized in the UI. */
export const REPORT_FRESH_DAYS = 90;

export function isReportFresh(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < REPORT_FRESH_DAYS * 24 * 3600 * 1000;
}
