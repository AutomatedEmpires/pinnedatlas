import { Icon } from '@/components/icon';
import { SectionHeading, cardClass } from '@/components/ui';
import type { Guidance } from '@/lib/guidance';
import type { FeatureType } from '@/lib/types';

/**
 * Presentational render of derived trip guidance. Content comes entirely from
 * getGuidance() — this component only lays it out in scannable sections.
 */
export function GuidancePanel({
  guidance,
  featureType,
}: {
  guidance: Guidance;
  featureType: FeatureType;
}) {
  return (
    <section aria-label="Plan your visit">
      <SectionHeading
        eyebrow="Field notes"
        title={
          <span className="flex items-center gap-2.5">
            <Icon name={featureType} size={22} weight="fill" className="text-accent" />
            Plan your visit
          </span>
        }
        className="mb-4"
      />

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={cardClass({ className: 'p-5' })}>
            <div className="flex items-center gap-2 text-accent">
              <Icon name="compass" size={18} weight="fill" />
              <h3 className="text-sm font-semibold text-stone-100">Best time to go</h3>
            </div>
            <p className="mt-3 font-display text-lg font-semibold text-stone-50">
              {guidance.bestTime.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-400">
              {guidance.bestTime.detail}
            </p>
          </div>

          <div className={cardClass({ className: 'p-5' })}>
            <div className="flex items-center gap-2 text-accent">
              <Icon name="map" size={18} weight="fill" />
              <h3 className="text-sm font-semibold text-stone-100">Effort</h3>
            </div>
            <p className="mt-3 font-display text-lg font-semibold text-stone-50">
              {guidance.effort.label}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-400">{guidance.effort.detail}</p>
          </div>
        </div>

        {guidance.bring.length > 0 && (
          <div className={cardClass({ className: 'p-5' })}>
            <div className="flex items-center gap-2 text-stone-100">
              <Icon name="list" size={18} className="text-accent" />
              <h3 className="text-sm font-semibold">What to bring</h3>
            </div>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {guidance.bring.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed text-stone-300"
                >
                  <Icon name="check" size={16} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {guidance.goodToKnow.length > 0 && (
          <div className={cardClass({ className: 'p-5' })}>
            <div className="flex items-center gap-2 text-stone-100">
              <Icon name="community" size={18} className="text-accent" />
              <h3 className="text-sm font-semibold">Good to know</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {guidance.goodToKnow.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-stone-400">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs leading-relaxed text-stone-500">
          General guidance based on feature type and difficulty — always verify current conditions.
        </p>
      </div>
    </section>
  );
}
