import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { listPendingLocations } from '@/lib/db/locations';
import { listRecentReports } from '@/lib/db/reports';
import { directionsUrl, formatCoords, timeAgo } from '@/lib/geo';
import {
  ACCESS_LABELS,
  DIFFICULTY_LABELS,
  FEATURE_TYPE_LABELS,
  REPORT_TYPE_LABELS,
} from '@/lib/types';
import { Icon } from '@/components/icon';
import { ModerateControls } from '@/components/moderate-controls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Moderation',
  robots: { index: false, follow: false },
};

export default async function ModerationPage() {
  const admin = await isAdmin();
  if (!admin) notFound();

  const [pendingLocations, recentReports] = await Promise.all([
    listPendingLocations(),
    listRecentReports(50),
  ]);

  return (
    <div className="mx-auto w-full max-w-shell px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Moderation queue</h1>
        <p className="mt-1 text-sm text-stone-400">
          Unlisted admin page — access is gated by{' '}
          <code className="rounded bg-surface-overlay px-1 py-0.5 text-xs">ADMIN_USER_IDS</code>.
        </p>
      </header>

      <section aria-labelledby="pending-locations-heading" className="mb-10">
        <h2 id="pending-locations-heading" className="mb-3 text-base font-semibold">
          Pending locations ({pendingLocations.length})
        </h2>
        {pendingLocations.length === 0 ? (
          <p className="rounded-xl border border-stone-800 bg-surface-raised p-4 text-sm text-stone-400">
            Queue clear.
          </p>
        ) : (
          <ul className="space-y-4">
            {pendingLocations.map((loc) => (
              <li
                key={loc.id}
                className="rounded-xl border border-stone-800 bg-surface-raised p-4"
              >
                <h3 className="font-medium">{loc.name}</h3>
                <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-stone-400">
                  <span className="text-stone-200">
                    {FEATURE_TYPE_LABELS[loc.feature_type]}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{DIFFICULTY_LABELS[loc.difficulty_tier]}</span>
                  <span aria-hidden>·</span>
                  <span>{ACCESS_LABELS[loc.access_type]}</span>
                </p>
                <p className="mt-2 flex items-center gap-2 font-mono text-xs text-stone-300">
                  {formatCoords(loc.lat, loc.lng)}
                  <a
                    href={directionsUrl(loc.lat, loc.lng)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${loc.name} in Google Maps`}
                    className="inline-flex items-center gap-1 text-accent hover:text-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <Icon name="directions" size={14} />
                    Map
                  </a>
                </p>
                {loc.description ? (
                  <p className="mt-2 text-sm text-stone-300">{loc.description}</p>
                ) : null}
                {loc.hazard_notes ? (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-400">
                    <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
                    {loc.hazard_notes}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-stone-500">
                  Submitted by{' '}
                  <span className="font-mono">{loc.submitted_by ?? 'unknown'}</span> ·{' '}
                  {timeAgo(loc.created_at)}
                </p>
                <ModerateControls kind="location" id={loc.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-reports-heading">
        <h2 id="recent-reports-heading" className="mb-3 text-base font-semibold">
          Recent reports
        </h2>
        {recentReports.length === 0 ? (
          <p className="rounded-xl border border-stone-800 bg-surface-raised p-4 text-sm text-stone-400">
            No reports yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentReports.map((report) => (
              <li
                key={report.id}
                className="rounded-xl border border-stone-800 bg-surface-raised p-4"
              >
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400">
                  <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-stone-200">
                    {REPORT_TYPE_LABELS[report.report_type]}
                  </span>
                  <span className="font-mono">loc {report.location_id.slice(0, 8)}</span>
                  <span aria-hidden>·</span>
                  <span>{timeAgo(report.created_at)}</span>
                </p>
                <p className="mt-2 text-sm text-stone-300">{report.body}</p>
                <ModerateControls kind="report" id={report.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
