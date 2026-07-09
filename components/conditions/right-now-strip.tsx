import Link from 'next/link';
import { Icon } from '@/components/icon';
import { SectionHeading, badgeClass, cn } from '@/components/ui';
import { flowLabel, scoreColor, verdictTone } from '@/lib/conditions-ui';
import type { ConditionsLeader } from '@/lib/db/conditions';
import { FEATURE_TYPE_COLORS, FEATURE_TYPE_LABELS } from '@/lib/types';

/**
 * "Flowing right now" — a live, premium horizontal strip of the highest Go Score
 * spots, fused from real USGS streamflow + weather + daylight. Purely
 * presentational: renders nothing when there are no scored leaders.
 */
export function RightNowStrip({
  leaders,
  title = 'Flowing right now',
  eyebrow = 'Conditions',
}: {
  leaders: ConditionsLeader[];
  title?: string;
  eyebrow?: string;
}) {
  if (!leaders.length) return null;

  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <SectionHeading eyebrow={eyebrow} title={title} />
        <p className="hidden max-w-[16rem] shrink-0 text-right text-xs leading-relaxed text-stone-500 sm:block">
          Go Scores fuse live USGS streamflow, weather &amp; daylight — updated continuously.
        </p>
      </div>

      {/* Edge-bleed scroller: cards align to the page gutter but scroll to the
          true screen edge for a premium, app-like feel. */}
      <div className="-mx-4 mt-4 sm:-mx-6 lg:-mx-8">
        <ul
          className={cn(
            'flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {leaders.map((leader) => (
            <li key={leader.slug} className="shrink-0 snap-start">
              <LeaderCard leader={leader} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LeaderCard({ leader }: { leader: ConditionsLeader }) {
  const color = FEATURE_TYPE_COLORS[leader.feature_type];
  const score = Math.round(leader.condition_score);
  const tint = scoreColor(leader.condition_score);
  const flow = leader.feature_type === 'waterfall' ? flowLabel(leader.condition_flow_pct) : null;

  return (
    <Link
      href={`/location/${leader.slug}`}
      className="group flex h-full w-[15.5rem] flex-col rounded-2xl bg-surface-raised p-4 hairline transition-all duration-200 ease-spring hover:-translate-y-0.5 hover:bg-surface-overlay hover:shadow-float focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-[16.5rem]"
    >
      {/* Type chip + live pulse */}
      <div className="flex items-center justify-between">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5 transition-transform duration-200 ease-spring group-hover:scale-105"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon name={leader.feature_type} size={18} weight="fill" />
        </span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 motion-safe:animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Live
        </span>
      </div>

      {/* Name + place */}
      <div className="mt-3 min-w-0">
        <h3 className="truncate font-display text-lg font-semibold text-stone-50">{leader.name}</h3>
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {FEATURE_TYPE_LABELS[leader.feature_type]}
          {leader.state_code ? ` · ${leader.state_code}` : ''}
        </p>
      </div>

      {leader.condition_headline && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-stone-400">
          {leader.condition_headline}
        </p>
      )}

      {/* Go Score hero — pinned to the bottom so cards read as a row */}
      <div className="mt-auto border-t border-white/[0.06] pt-3">
        <div className="flex items-end justify-between gap-2">
          <div className="leading-none">
            <span className="flex items-baseline gap-1">
              <span
                className="font-display text-4xl font-semibold tabular-nums"
                style={{ color: tint, textShadow: `0 0 26px ${tint}44` }}
              >
                {score}
              </span>
              <span className="text-xs font-medium text-stone-600">/100</span>
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Go Score
            </span>
          </div>
          <span className={badgeClass(verdictTone(leader.condition_verdict))}>
            {leader.condition_verdict}
          </span>
        </div>

        {flow && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <Icon name="waterfall" size={13} weight="fill" className="shrink-0 text-sky-400" />
            <span className="font-medium text-stone-300">{flow}</span>
            {leader.condition_flow_pct != null && (
              <span className="truncate text-stone-500">
                {'·'} {leader.condition_flow_pct}% of normal
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
