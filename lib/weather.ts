import 'server-only';

// Live weather intelligence for a location. Fetched server-side from Open-Meteo
// (free, no API key, so no client CSP concern). Lat/lng are rounded to 2 decimals
// in the request URL so nearby spots share a cache entry, and the response is
// cached for 30 minutes. Any failure or timeout resolves to null — the UI treats
// weather as an enhancement, never a hard dependency.

export interface WeatherCondition {
  label: string;
  /** Short emoji for the WMO weather code. */
  icon: string;
}

export interface WeatherCurrent {
  tempF: number;
  code: number;
  label: string;
  icon: string;
  windMph: number;
  /** Current precipitation, inches. */
  precip: number;
}

export interface WeatherToday {
  /** Local ISO timestamps from Open-Meteo (e.g. "2026-07-08T06:12"). */
  sunrise: string;
  sunset: string;
  hiF: number;
  loF: number;
  precipProb: number;
}

export interface WeatherDay {
  /** Local ISO date, "YYYY-MM-DD". */
  date: string;
  code: number;
  label: string;
  icon: string;
  hiF: number;
  loF: number;
  precipProb: number;
}

export interface WeatherData {
  current: WeatherCurrent;
  today: WeatherToday;
  /** Seven-day outlook, index 0 = today. */
  daily: WeatherDay[];
}

// WMO weather interpretation codes → a plain-language label + one short emoji.
// Palette intentionally small: ☀️ ⛅ ☁️ 🌧️ ⛈️ 🌨️ 🌫️.
const WMO: Record<number, WeatherCondition> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '⛅' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌧️' },
  53: { label: 'Drizzle', icon: '🌧️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌨️' },
  57: { label: 'Freezing drizzle', icon: '🌨️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌨️' },
  67: { label: 'Freezing rain', icon: '🌨️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '🌨️' },
  77: { label: 'Snow grains', icon: '🌨️' },
  80: { label: 'Light showers', icon: '🌧️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Heavy showers', icon: '🌧️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm, hail', icon: '⛈️' },
  99: { label: 'Thunderstorm, hail', icon: '⛈️' },
};

function describeCode(code: number): WeatherCondition {
  return WMO[code] ?? { label: 'Unsettled', icon: '☁️' };
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
  };
}

const round = (n: number | undefined | null): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0;

export async function getWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

    const res = await fetch(url, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as OpenMeteoResponse;
    const c = json.current;
    const d = json.daily;
    if (
      !c ||
      !d ||
      !Array.isArray(d.time) ||
      d.time.length === 0 ||
      !Array.isArray(d.weather_code) ||
      !Array.isArray(d.temperature_2m_max) ||
      !Array.isArray(d.temperature_2m_min) ||
      !Array.isArray(d.sunrise) ||
      !Array.isArray(d.sunset)
    ) {
      return null;
    }

    const currentCond = describeCode(c.weather_code ?? -1);
    const current: WeatherCurrent = {
      tempF: round(c.temperature_2m),
      code: c.weather_code ?? -1,
      label: currentCond.label,
      icon: currentCond.icon,
      windMph: round(c.wind_speed_10m),
      precip: typeof c.precipitation === 'number' ? c.precipitation : 0,
    };

    const count = Math.min(7, d.time.length);
    const daily: WeatherDay[] = [];
    for (let i = 0; i < count; i += 1) {
      const cond = describeCode(d.weather_code[i] ?? -1);
      daily.push({
        date: d.time[i],
        code: d.weather_code[i] ?? -1,
        label: cond.label,
        icon: cond.icon,
        hiF: round(d.temperature_2m_max[i]),
        loF: round(d.temperature_2m_min[i]),
        precipProb: round(d.precipitation_probability_max?.[i]),
      });
    }
    if (daily.length === 0) return null;

    const today: WeatherToday = {
      sunrise: d.sunrise[0],
      sunset: d.sunset[0],
      hiF: daily[0].hiF,
      loF: daily[0].loF,
      precipProb: daily[0].precipProb,
    };

    return { current, today, daily };
  } catch {
    return null;
  }
}
