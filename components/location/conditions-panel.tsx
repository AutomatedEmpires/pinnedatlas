import { Icon } from '@/components/icon';
import { badgeClass, cardClass, cn } from '@/components/ui';
import type { ConditionsReport, FactorStatus } from '@/lib/conditions';
import { flowLabel, scoreColor, verdictTone } from '@/lib/conditions-ui';
import { timeAgo } from '@/lib/geo';

// The Conditions "Go Score" — the signature, category-defining module. It turns
// the live ConditionsReport (streamflow + weather + daylight + season) into an
// instantly legible "is it worth going right now?" verdict, then shows its work
// so the score reads as trustworthy guidance rather than a black box.
//
// Presentational only: every number, phrase, and factor comes from the report.

/** Status → dot color, mirroring the shared conditions color language. */
const FACTOR_DOT: Record<FactorStatus, string> = {
  great: 'bg-accent', // emerald
  good: 'bg-teal-400',
  fair: 'bg-topaz',
  poor: 'bg-amber-400',
  info: 'bg-stone-500',
};

/** Flow bar/number color from percent-of-normal. */
function flowColor(pct: number): string {
  if (pct >= 120) return '#34d399'; // emerald — roaring / strong
  if (pct >= 80) return '#2dd4bf'; // teal — healthy
  if (pct >= 40) return '#f5b544'; // topaz — moderate
  return '#fbbf24'; // amber — low / dry
}

const RING_R = 52;
const RING_CIRC = 2 * Math.PI * RING_R;

export function ConditionsPanel({ report }: { report: ConditionsReport | null }) {
  // Graceful null state — the live services are best-effort.
  if (!report) {
    return (
      <section className={cardClass({ className: 'p-5' })} aria-label="Live conditions">
        <div className="flex items-center gap-2 text-stone-500">
          <Icon name="compass" size={15} />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Live conditions</span>
        </div>
        <p className="mt-2 text-sm text-stone-400">
          Live conditions are unavailable right now — check back shortly.
        </p>
      </section>
    );
  }

  const { goScore, verdict, headline, factors, flow, updatedAt } = report;
  const color = scoreColor(goScore);
  const dash = RING_CIRC * (1 - Math.max(0, Math.min(100, goScore)) / 100);
  const showFlow = flow != null && flow.percentOfNormal != null;

  return (
    <section
      className={cardClass({ className: 'relative overflow-hidden p-5 sm:p-6 lg:p-7' })}
      aria-label="Live conditions and Go Score"
    >
      {/* Score-tinted ambient glow — premium depth that reads the verdict at a glance. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-24 h-60 w-60 rounded-full opacity-[0.13] blur-3xl"
        style={{ background: color }}
      />

      <div className="relative">
        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <Icon name="compass" size={15} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Conditions · Go Score
          </span>
        </div>

        {/* Centerpiece: the ring + verdict + headline */}
        <div className="mt-4 flex items-center gap-5 sm:gap-6">
          <div
            className="relative shrink-0"
            role="img"
            aria-label={`Go Score ${goScore} out of 100 — ${verdict}`}
          >
            <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90 sm:h-28 sm:w-28">
              <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRC}
                strokeDashoffset={dash}
                style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display text-[2rem] font-semibold leading-none tabular-nums sm:text-4xl"
                style={{ color }}
              >
                {goScore}
              </span>
              <span className="mt-0.5 text-[10px] font-medium tabular-nums text-stone-500">/ 100</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <span className={badgeClass(verdictTone(verdict))}>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {verdict}
            </span>
            <p className="mt-2.5 font-display text-lg font-semibold leading-snug text-stone-50 sm:text-xl">
              {headline}
            </p>
          </div>
        </div>

        {/* Streamflow — the waterfall star. */}
        {flow != null && flow.percentOfNormal != null && (
          <div className="mt-5 rounded-xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon name="waterfall" size={15} className="text-sky-300" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    Streamflow
                  </span>
                </div>
                <p className="mt-1.5 font-display text-lg font-semibold text-stone-50">
                  {flowLabel(flow.percentOfNormal)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div
                  className="font-display text-2xl font-semibold leading-none tabular-nums"
                  style={{ color: flowColor(flow.percentOfNormal) }}
                >
                  {flow.percentOfNormal}%
                </div>
                <div className="mt-1 text-[11px] text-stone-500">of normal</div>
              </div>
            </div>

            {/* current vs median, on a 0–2× scale with a "normal" tick at the median */}
            <div className="mt-3">
              <div className="relative h-2 rounded-full bg-white/[0.08]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.max(2, Math.min(flow.percentOfNormal, 200) / 2)}%`,
                    background: flowColor(flow.percentOfNormal),
                  }}
                />
                <div
                  aria-hidden
                  className="absolute -top-1 -bottom-1 left-1/2 w-px bg-white/50"
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-stone-500">
                <span>Low</span>
                <span>Normal</span>
                <span>2×</span>
              </div>
            </div>

            <p className="mt-2.5 text-[11px] leading-relaxed text-stone-500">
              Nearest gauge: <span className="text-stone-400">{flow.siteName}</span> ·{' '}
              {flow.distanceKm} km · USGS
              {flow.medianCfs != null && (
                <>
                  {' '}
                  · {Math.round(flow.currentCfs).toLocaleString()} cfs now vs ~
                  {Math.round(flow.medianCfs).toLocaleString()} normal
                </>
              )}
            </p>
          </div>
        )}

        {/* The explainable factors — this transparency is what makes the score trustworthy. */}
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Why this score
          </span>
          <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map((f, i) => (
              <li key={`${f.key}-${i}`} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={cn('mt-[7px] h-2 w-2 shrink-0 rounded-full', FACTOR_DOT[f.status])}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-100">{f.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-400">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer: live-ness + disclaimer */}
        <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-3.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2 text-[11px] font-medium text-stone-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Live conditions · updated {timeAgo(updatedAt)}
          </span>
          <span className="text-[11px] leading-relaxed text-stone-500">
            Guidance fused from live weather, daylight &amp; season
            {showFlow ? ' & streamflow' : ''}. {showFlow ? 'Verify flow on-site.' : 'Verify on-site.'}
          </span>
        </div>
      </div>
    </section>
  );
}
