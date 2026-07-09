import 'server-only';
import { getStreamflow, type Streamflow } from '@/lib/usgs';
import type { FeatureType } from '@/lib/types';

// The Conditions Engine — a live, explainable "is it worth going right now?"
// verdict for any natural feature. It fuses real streamflow (waterfalls),
// weather, daylight, season, and flood/closure risk into a 0–100 Go Score with
// the reasons shown, so it reads as trustworthy guidance rather than a black box.

export type FactorStatus = 'great' | 'good' | 'fair' | 'poor' | 'info';
export type Verdict = 'Prime' | 'Good' | 'Fair' | 'Low' | 'Caution';

export interface ConditionFactor {
  key: string;
  label: string;
  detail: string;
  status: FactorStatus;
}

export interface ConditionsReport {
  goScore: number;
  verdict: Verdict;
  headline: string;
  factors: ConditionFactor[];
  flow: Streamflow | null;
  updatedAt: string;
}

export interface ConditionsInput {
  feature_type: FeatureType;
  tempF: number;
  precipNow: number; // mm in the current period
  weatherCode: number;
  recentPrecipMm: number; // sum over ~8 days
  month: number; // 1–12, local to the spot
  dayOfWeek: number; // 0=Sun … 6=Sat, local
  isDaytime: boolean;
  hoursUntilSunset: number;
  flow: Streamflow | null;
  // 'now' = the true right-this-minute verdict (used on the detail page).
  // 'planning' = a durable "is this spot in good shape?" score that ignores
  // time-of-day, so the map/discovery don't show everything as poor at night.
  mode?: 'now' | 'planning';
}

const CLEAR = new Set([0, 1]);
const PARTLY = new Set([2, 3]);
const STORM = new Set([95, 96, 99]);

function fmtH(h: number): string {
  if (h <= 0) return 'none';
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h.toFixed(h < 3 ? 1 : 0)} h`;
}

/** Pure, deterministic scoring — unit-testable without network. */
export function computeConditions(input: ConditionsInput): Omit<ConditionsReport, 'updatedAt'> {
  const f: ConditionFactor[] = [];
  let score = 55;
  let caution = false;

  // --- Weather now ---
  if (input.precipNow > 0.4 || STORM.has(input.weatherCode)) {
    const storm = STORM.has(input.weatherCode);
    f.push({
      key: 'weather',
      label: storm ? 'Storms right now' : 'Rain right now',
      detail: storm ? 'Thunderstorms in the area — hold off.' : 'Active rain may make footing slick.',
      status: 'poor',
    });
    score -= storm ? 22 : 12;
    if (storm) caution = true;
  } else if (CLEAR.has(input.weatherCode)) {
    f.push({ key: 'weather', label: 'Clear skies', detail: 'Great visibility and dry footing.', status: 'great' });
    score += 12;
  } else if (PARTLY.has(input.weatherCode)) {
    f.push({ key: 'weather', label: 'Partly cloudy', detail: 'Fair skies overall.', status: 'good' });
    score += 5;
  } else {
    f.push({ key: 'weather', label: 'Overcast', detail: 'Grey but workable.', status: 'fair' });
  }
  if (input.tempF <= 32) {
    f.push({ key: 'temp', label: 'Freezing', detail: `About ${Math.round(input.tempF)}°F — dress for it.`, status: 'poor' });
    score -= 8;
  } else if (input.tempF >= 95) {
    f.push({ key: 'temp', label: 'Very hot', detail: `About ${Math.round(input.tempF)}°F — carry extra water.`, status: 'fair' });
    score -= 8;
  }

  // --- Daylight (only in "now" mode; planning scores ignore time-of-day) ---
  if (input.mode === 'planning') {
    // no daylight adjustment
  } else if (!input.isDaytime) {
    f.push({ key: 'daylight', label: 'After dark', detail: 'The sun is down — bring lights and take care.', status: 'poor' });
    score -= 25;
    caution = true;
  } else if (input.hoursUntilSunset < 1.5) {
    f.push({ key: 'daylight', label: 'Little daylight left', detail: `Only ${fmtH(input.hoursUntilSunset)} until sunset.`, status: 'poor' });
    score -= 14;
  } else if (input.hoursUntilSunset < 3) {
    f.push({ key: 'daylight', label: 'Limited daylight', detail: `${fmtH(input.hoursUntilSunset)} of daylight left.`, status: 'fair' });
    score -= 4;
  } else {
    f.push({ key: 'daylight', label: 'Plenty of daylight', detail: `${fmtH(input.hoursUntilSunset)} until sunset.`, status: 'good' });
    score += 6;
  }

  // --- Season fit ---
  const m = input.month;
  if (input.feature_type === 'waterfall') {
    if ([4, 5, 6].includes(m)) {
      f.push({ key: 'season', label: 'Peak season', detail: 'Spring snowmelt drives the strongest flows.', status: 'great' });
      score += 12;
    } else if ([3, 7].includes(m)) {
      f.push({ key: 'season', label: 'In season', detail: 'Flows are usually still healthy.', status: 'good' });
      score += 6;
    } else if ([8, 9, 10].includes(m)) {
      f.push({ key: 'season', label: 'Late-season', detail: 'Many falls slow down by late summer.', status: 'fair' });
      score -= 8;
    }
  } else if (input.feature_type === 'hot_spring') {
    if ([11, 12, 1, 2, 3].includes(m)) {
      f.push({ key: 'season', label: 'Prime soaking season', detail: 'Cold air makes a hot soak sublime.', status: 'great' });
      score += 12;
    } else if ([6, 7, 8].includes(m)) {
      f.push({ key: 'season', label: 'Warm season', detail: 'A hot soak is less appealing in the heat.', status: 'fair' });
      score -= 8;
    } else {
      score += 4;
    }
  } else if (input.feature_type === 'spring') {
    if ([4, 5, 6].includes(m)) score += 8;
    else score += 2;
  } else if (input.feature_type === 'cave') {
    f.push({ key: 'season', label: 'Stable underground', detail: 'Caves hold a steady temperature year-round.', status: 'good' });
    score += 4;
    if ([10, 11, 12, 1, 2, 3].includes(m)) {
      f.push({ key: 'closure', label: 'Bat-closure season', detail: 'Many caves close in winter to protect bats — verify access.', status: 'info' });
    }
  }

  // --- Flow (the waterfall star, with a precipitation fallback) ---
  if (input.feature_type === 'waterfall') {
    const flow = input.flow;
    if (flow && flow.percentOfNormal != null) {
      const p = flow.percentOfNormal;
      const via = `Nearest gauge: ${flow.siteName} (${flow.distanceKm} km)`;
      if (p >= 200) {
        f.push({ key: 'flow', label: `Roaring — ${p}% of normal`, detail: via, status: 'great' });
        score += 26;
      } else if (p >= 120) {
        f.push({ key: 'flow', label: `Flowing strong — ${p}% of normal`, detail: via, status: 'great' });
        score += 20;
      } else if (p >= 80) {
        f.push({ key: 'flow', label: `Healthy flow — ${p}% of normal`, detail: via, status: 'good' });
        score += 12;
      } else if (p >= 40) {
        f.push({ key: 'flow', label: `Moderate flow — ${p}% of normal`, detail: via, status: 'fair' });
        score += 2;
      } else if (p >= 15) {
        f.push({ key: 'flow', label: `Low flow — ${p}% of normal`, detail: via, status: 'poor' });
        score -= 16;
      } else {
        f.push({ key: 'flow', label: `Likely dry — ${p}% of normal`, detail: via, status: 'poor' });
        score -= 28;
      }
    } else if (flow) {
      f.push({ key: 'flow', label: `Nearby river: ${Math.round(flow.currentCfs)} cfs`, detail: `${flow.siteName} (${flow.distanceKm} km)`, status: 'info' });
    } else {
      // No gauge nearby — infer from recent rain.
      const r = input.recentPrecipMm;
      if (r >= 40) {
        f.push({ key: 'flow', label: 'Likely flowing well', detail: 'Solid rain over the past week.', status: 'good' });
        score += 12;
      } else if (r >= 12) {
        f.push({ key: 'flow', label: 'Some recent rain', detail: 'A little rain lately — flow may be moderate.', status: 'fair' });
        score += 4;
      } else if ([7, 8, 9].includes(m)) {
        f.push({ key: 'flow', label: 'Dry spell', detail: 'Little rain and late-season — flow likely low.', status: 'poor' });
        score -= 12;
      } else {
        f.push({ key: 'flow', label: 'No recent rain', detail: 'Flow depends on snowmelt and springs.', status: 'fair' });
      }
    }
  }

  // --- Cave flood risk ---
  if (input.feature_type === 'cave' && input.recentPrecipMm > 30) {
    f.push({ key: 'flood', label: 'Flash-flood risk', detail: 'Heavy recent rain — caves can flood fast.', status: 'poor' });
    score -= 14;
    caution = true;
  }

  // --- Crowds ---
  if (input.dayOfWeek === 0 || input.dayOfWeek === 6) {
    f.push({ key: 'crowd', label: 'Weekend', detail: 'Expect more visitors — arrive early.', status: 'info' });
    score -= 3;
  } else {
    f.push({ key: 'crowd', label: 'Quieter weekday', detail: 'Fewer people midweek.', status: 'good' });
    score += 3;
  }

  const goScore = Math.max(0, Math.min(100, Math.round(score)));
  const verdict: Verdict = caution
    ? 'Caution'
    : goScore >= 80
      ? 'Prime'
      : goScore >= 64
        ? 'Good'
        : goScore >= 46
          ? 'Fair'
          : 'Low';

  const headline = buildHeadline(input, f, verdict);
  return { goScore, verdict, headline, factors: f, flow: input.flow };
}

function buildHeadline(input: ConditionsInput, factors: ConditionFactor[], verdict: Verdict): string {
  if (input.mode !== 'planning' && !input.isDaytime)
    return 'Heading out after dark — bring lights and take extra care.';
  const flood = factors.find((x) => x.key === 'flood');
  if (flood) return 'Recent heavy rain — real flash-flood risk. Consider waiting.';
  if (input.feature_type === 'waterfall') {
    const flow = factors.find((x) => x.key === 'flow');
    if (flow) {
      if (flow.status === 'great') return `${flow.label.split(' — ')[0]} right now — go today.`;
      if (flow.status === 'poor') return `${flow.label} — better after rain or in spring.`;
    }
  }
  if (input.feature_type === 'hot_spring' && [11, 12, 1, 2, 3].includes(input.month))
    return 'Cold air, prime soaking weather — great tonight.';
  switch (verdict) {
    case 'Prime':
      return 'Conditions are excellent right now — go for it.';
    case 'Good':
      return 'Good conditions to visit today.';
    case 'Fair':
      return 'Fair conditions — worth a look, with expectations set.';
    case 'Caution':
      return 'Worth going, but mind the flagged risks.';
    default:
      return 'Conditions are below their best right now.';
  }
}

const OM_URL = 'https://api.open-meteo.com/v1/forecast';

/** Fetch live inputs + score them. Returns null only if weather is unreachable. */
export async function getConditions(
  location: {
    lat: number;
    lng: number;
    feature_type: FeatureType;
  },
  mode: 'now' | 'planning' = 'now',
): Promise<ConditionsReport | null> {
  const lat = Math.round(location.lat * 100) / 100;
  const lng = Math.round(location.lng * 100) / 100;
  const url =
    `${OM_URL}?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,precipitation,weather_code' +
    '&daily=precipitation_sum,sunrise,sunset' +
    '&past_days=7&forecast_days=1&temperature_unit=fahrenheit&timezone=auto';

  const [omRes, flow] = await Promise.all([
    fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4500) }).catch(() => null),
    location.feature_type === 'waterfall' ? getStreamflow(location.lat, location.lng) : Promise.resolve(null),
  ]);

  if (!omRes || !omRes.ok) return null;
  let om: {
    current?: { time?: string; temperature_2m?: number; precipitation?: number; weather_code?: number };
    daily?: { time?: string[]; precipitation_sum?: number[]; sunrise?: string[]; sunset?: string[] };
  };
  try {
    om = await omRes.json();
  } catch {
    return null;
  }
  const cur = om.current;
  const daily = om.daily;
  if (!cur?.time || !daily?.sunrise || !daily?.sunset) return null;

  const todayIdx = (daily.sunrise.length || 1) - 1; // past_days=7 + today → last entry
  const sunrise = daily.sunrise[todayIdx] ?? '';
  const sunset = daily.sunset[todayIdx] ?? '';
  const nowLocal = cur.time;
  const isDaytime = nowLocal >= sunrise && nowLocal < sunset;
  const hoursUntilSunset = Math.max(0, (Date.parse(sunset) - Date.parse(nowLocal)) / 3_600_000);
  const recentPrecipMm = (daily.precipitation_sum ?? []).reduce((a, b) => a + (Number(b) || 0), 0);
  const month = Number(nowLocal.slice(5, 7)) || new Date().getUTCMonth() + 1;
  const [y, mo, d] = nowLocal.slice(0, 10).split('-').map(Number);
  const dayOfWeek = Number.isFinite(y) ? new Date(y, (mo || 1) - 1, d || 1).getDay() : new Date().getUTCDay();

  const report = computeConditions({
    feature_type: location.feature_type,
    tempF: Number(cur.temperature_2m ?? 60),
    precipNow: Number(cur.precipitation ?? 0),
    weatherCode: Number(cur.weather_code ?? 3),
    recentPrecipMm,
    month,
    dayOfWeek,
    isDaytime,
    hoursUntilSunset,
    flow,
    mode,
  });

  return { ...report, updatedAt: new Date().toISOString() };
}
