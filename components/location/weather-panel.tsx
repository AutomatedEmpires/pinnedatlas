import type { WeatherData } from '@/lib/weather';

// Presentational weather intelligence. Renders nothing when weather is
// unavailable so callers can drop it into a layout unconditionally.

/** Format a local ISO timestamp ("2026-07-08T06:12") as "6:12 AM" without any
 *  timezone conversion — the string is already local to the spot. */
function formatClock(iso: string): string {
  const time = iso.split('T')[1] ?? '';
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  if (!Number.isFinite(h)) return '—';
  const minutes = mRaw ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${minutes} ${period}`;
}

/** Short weekday for a local ISO date; index 0 is labelled "Today". */
function weekday(date: string, index: number): string {
  if (index === 0) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
}

export function WeatherPanel({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;
  const { current, today, daily } = weather;

  return (
    <section
      aria-label="Weather forecast"
      className="overflow-hidden rounded-2xl bg-surface-raised hairline"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          Forecast
        </span>
        <span className="text-[11px] text-stone-500">Open-Meteo</span>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-4 px-4 pb-4 pt-2.5">
        <span aria-hidden className="text-[2.75rem] leading-none">
          {current.icon}
        </span>
        <div className="min-w-0">
          <div className="font-display text-4xl font-semibold leading-none text-stone-50 tabular-nums">
            {current.tempF}
            <span className="align-top text-2xl text-stone-400">°</span>
          </div>
          <div className="mt-1 truncate text-sm text-stone-300">{current.label}</div>
        </div>
        <div className="ml-auto shrink-0 space-y-1 text-right text-xs text-stone-400">
          <div>Wind {current.windMph} mph</div>
          <div className="tabular-nums">
            H {today.hiF}° · L {today.loF}°
          </div>
        </div>
      </div>

      {/* Sun times — topaz accent */}
      <div className="mx-4 flex items-center justify-between gap-3 rounded-xl bg-topaz/5 px-3 py-2 text-xs ring-1 ring-inset ring-topaz/15">
        <span className="flex items-center gap-1.5">
          <span aria-hidden>🌅</span>
          <span className="text-stone-400">
            Sunrise{' '}
            <span className="font-medium text-stone-100 tabular-nums">
              {formatClock(today.sunrise)}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden>🌇</span>
          <span className="text-stone-400">
            Sunset{' '}
            <span className="font-medium text-stone-100 tabular-nums">
              {formatClock(today.sunset)}
            </span>
          </span>
        </span>
      </div>

      {/* 7-day outlook */}
      <div className="mt-3 px-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
          Next 7 days
        </span>
      </div>
      <ul className="mt-2 flex gap-2 overflow-x-auto px-4 pb-4 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {daily.map((day, i) => (
          <li
            key={day.date}
            className="flex w-[3.25rem] shrink-0 flex-col items-center gap-1 rounded-xl bg-white/[0.03] px-1 py-2.5 ring-1 ring-inset ring-white/5"
          >
            <span className="text-[11px] font-medium text-stone-400">{weekday(day.date, i)}</span>
            <span aria-hidden className="text-lg leading-none" title={day.label}>
              {day.icon}
            </span>
            <span className="sr-only">{day.label}</span>
            <span className="text-xs font-semibold text-stone-100 tabular-nums">{day.hiF}°</span>
            <span className="text-[11px] text-stone-500 tabular-nums">{day.loF}°</span>
            <span className="flex items-center gap-0.5 text-[10px] text-sky-300/80 tabular-nums">
              <span aria-hidden>💧</span>
              {day.precipProb}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
