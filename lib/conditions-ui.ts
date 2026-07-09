// Shared, client-safe presentation helpers for the Conditions "Go Score" so the
// map, detail page, and discovery surfaces all speak the same visual language.
// (No 'server-only' — imported by client components.)

export type ConditionVerdict = 'Prime' | 'Good' | 'Fair' | 'Low' | 'Caution';

export type ConditionTone = 'accent' | 'teal' | 'topaz' | 'neutral' | 'amber';

/** badgeClass() tone for a verdict. */
export function verdictTone(verdict: string | null): ConditionTone {
  switch (verdict) {
    case 'Prime':
      return 'accent';
    case 'Good':
      return 'teal';
    case 'Fair':
      return 'topaz';
    case 'Caution':
      return 'amber';
    default:
      return 'neutral';
  }
}

/** Hex color for a Go Score (map pins, meters). Null score → muted stone. */
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return '#57534e'; // stone-600 — not yet scored
  if (score >= 80) return '#34d399'; // emerald — prime
  if (score >= 64) return '#2dd4bf'; // teal — good
  if (score >= 46) return '#f5b544'; // topaz — fair
  return '#a8a29e'; // stone-400 — low
}

/** A one-word label derived from a score when no verdict string is present. */
export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return 'Unrated';
  if (score >= 80) return 'Prime';
  if (score >= 64) return 'Good';
  if (score >= 46) return 'Fair';
  return 'Low';
}

/** Short flow phrase from percent-of-normal (waterfalls). */
export function flowLabel(pct: number | null | undefined): string | null {
  if (pct == null) return null;
  if (pct >= 200) return 'Roaring';
  if (pct >= 120) return 'Flowing strong';
  if (pct >= 80) return 'Healthy flow';
  if (pct >= 40) return 'Moderate flow';
  if (pct >= 15) return 'Low flow';
  return 'Likely dry';
}
