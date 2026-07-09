import type { ReactNode } from 'react';

/** Tiny classnames joiner (no dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'topaz';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-spring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-stone-950 hover:bg-accent-strong shadow-[0_8px_24px_-12px_rgba(52,211,153,0.6)]',
  secondary: 'border border-white/10 bg-white/[0.03] text-stone-100 hover:border-white/20 hover:bg-white/[0.07]',
  ghost: 'text-stone-300 hover:bg-white/5 hover:text-stone-100',
  topaz: 'bg-topaz text-stone-950 hover:brightness-105',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

/** Class string for a button/link/anchor — flexible across elements. */
export function buttonClass(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cn(
    BUTTON_BASE,
    BUTTON_VARIANTS[opts?.variant ?? 'primary'],
    BUTTON_SIZES[opts?.size ?? 'md'],
    opts?.className,
  );
}

type BadgeTone = 'neutral' | 'accent' | 'topaz' | 'amber' | 'violet' | 'sky' | 'rose' | 'teal';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-white/5 text-stone-300 ring-white/10',
  accent: 'bg-accent/10 text-accent ring-accent/25',
  topaz: 'bg-topaz/10 text-topaz ring-topaz/25',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/25',
  rose: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-500/25',
};

export function badgeClass(tone: BadgeTone = 'neutral', className?: string): string {
  return cn(
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
    BADGE_TONES[tone],
    className,
  );
}

/** Card surface: layered, hairline border, optional hover lift. */
export function cardClass(opts?: { hover?: boolean; className?: string }): string {
  return cn(
    'rounded-2xl bg-surface-raised hairline',
    opts?.hover &&
      'transition-transform duration-200 ease-spring hover:-translate-y-0.5 hover:shadow-float',
    opts?.className,
  );
}

/** Small uppercase eyebrow + optional display title. */
export function SectionHeading({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className="font-display text-xl font-semibold text-stone-50 sm:text-2xl">{title}</h2>
      )}
      {children}
    </div>
  );
}

/** A labelled stat tile for at-a-glance detail. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/5', className)}>
      <div className="flex items-center gap-1.5 text-xs text-stone-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-stone-100">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-stone-500">{hint}</div>}
    </div>
  );
}
