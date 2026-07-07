import { Icon } from '@/components/icon';

export const DEFAULT_SAFETY_COPY =
  'Natural areas are hazardous and conditions change fast. Verify access and current conditions before you go, respect private property and closures, and leave no trace. You are responsible for your own safety.';

/** Amber safety callout shown on every location detail page — never paywalled. */
export function SafetyNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div
      role="note"
      aria-label="Safety notice"
      className="flex gap-3 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100"
    >
      <Icon name="warning" size={20} className="mt-0.5 shrink-0 text-amber-400" />
      <div className="min-w-0 leading-relaxed">{children ?? DEFAULT_SAFETY_COPY}</div>
    </div>
  );
}
