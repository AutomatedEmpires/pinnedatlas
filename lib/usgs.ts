import 'server-only';
import { haversineKm } from '@/lib/geo';

// Live streamflow from USGS NWIS (free, no key). We find the nearest active
// discharge gauge to a spot, read its real-time flow, and compare against the
// long-term median flow for today's date to get a "percent of normal" — the
// signal that tells you whether a waterfall is roaring or a trickle right now.

export interface Streamflow {
  siteName: string;
  siteCode: string;
  distanceKm: number;
  currentCfs: number;
  medianCfs: number | null;
  percentOfNormal: number | null;
  dateTime: string;
}

const IV_URL = 'https://waterservices.usgs.gov/nwis/iv/';
const STAT_URL = 'https://waterservices.usgs.gov/nwis/stat/';
const MAX_GAUGE_KM = 40; // beyond this the gauge isn't a fair proxy for the spot

interface Gauge {
  dist: number;
  cfs: number;
  dateTime: string;
  siteName: string;
  siteCode: string;
}

async function nearestGauge(lat: number, lng: number): Promise<Gauge | null> {
  const d = 0.35;
  const bbox = [lng - d, lat - d, lng + d, lat + d].map((n) => n.toFixed(4)).join(',');
  const url = `${IV_URL}?format=json&bBox=${bbox}&parameterCd=00060&siteStatus=active`;
  const res = await fetch(url, {
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(4500),
    headers: { 'User-Agent': 'PinnedAtlas/1.0 (conditions)' },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    value?: { timeSeries?: Array<Record<string, unknown>> };
  };
  const series = json?.value?.timeSeries ?? [];
  let best: Gauge | null = null;
  for (const t of series) {
    const info = t.sourceInfo as
      | {
          siteName?: string;
          siteCode?: Array<{ value?: string }>;
          geoLocation?: { geogLocation?: { latitude?: number; longitude?: number } };
        }
      | undefined;
    const values = t.values as Array<{ value?: Array<{ value?: string; dateTime?: string }> }> | undefined;
    const gl = info?.geoLocation?.geogLocation;
    const v = values?.[0]?.value?.[0];
    if (!gl || !v || v.value === undefined) continue;
    const cfs = Number(v.value);
    // USGS uses -999999 for "no reading".
    if (!Number.isFinite(cfs) || cfs < 0) continue;
    const glat = Number(gl.latitude);
    const glng = Number(gl.longitude);
    if (!Number.isFinite(glat) || !Number.isFinite(glng)) continue;
    const dist = haversineKm(lat, lng, glat, glng);
    if (!best || dist < best.dist) {
      best = {
        dist,
        cfs,
        dateTime: v.dateTime ?? '',
        siteName: info?.siteName ?? 'River gauge',
        siteCode: info?.siteCode?.[0]?.value ?? '',
      };
    }
  }
  if (!best || best.dist > MAX_GAUGE_KM) return null;
  return best;
}

async function medianForToday(siteCode: string): Promise<number | null> {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const url = `${STAT_URL}?format=rdb&sites=${siteCode}&statReportType=daily&statTypeCd=p50&parameterCd=00060`;
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(4500),
    headers: { 'User-Agent': 'PinnedAtlas/1.0 (conditions)' },
  });
  if (!res.ok) return null;
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
  if (lines.length < 3) return null;
  const header = lines[0].split('\t');
  const iMonth = header.indexOf('month_nu');
  const iDay = header.indexOf('day_nu');
  const iP50 = header.indexOf('p50_va');
  if (iMonth < 0 || iDay < 0 || iP50 < 0) return null;
  // Row 0 = header, row 1 = the "5s 15s ..." format spec, data starts at 2.
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    if (Number(cols[iMonth]) === month && Number(cols[iDay]) === day) {
      const p = Number(cols[iP50]);
      return Number.isFinite(p) ? p : null;
    }
  }
  return null;
}

/** Nearest-gauge streamflow + percent-of-normal for a spot, or null if none nearby. */
export async function getStreamflow(lat: number, lng: number): Promise<Streamflow | null> {
  try {
    const gauge = await nearestGauge(lat, lng);
    if (!gauge) return null;
    const median = gauge.siteCode ? await medianForToday(gauge.siteCode) : null;
    const percentOfNormal =
      median && median > 0 ? Math.round((gauge.cfs / median) * 100) : null;
    return {
      siteName: gauge.siteName,
      siteCode: gauge.siteCode,
      distanceKm: Math.round(gauge.dist * 10) / 10,
      currentCfs: gauge.cfs,
      medianCfs: median,
      percentOfNormal,
      dateTime: gauge.dateTime,
    };
  } catch {
    return null;
  }
}
