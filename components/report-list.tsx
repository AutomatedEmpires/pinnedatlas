import { isReportFresh, timeAgo } from '@/lib/geo';
import { REPORT_TYPE_LABELS, type LocationReport } from '@/lib/types';

export function ReportList({ reports }: { reports: LocationReport[] }) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        No reports yet — be the first to share current conditions.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => {
        const fresh = isReportFresh(report.created_at);
        const urgent = report.report_type === 'closure' || report.report_type === 'hazard';
        return (
          <li
            key={report.id}
            className={`rounded-xl bg-surface-raised p-3 ${fresh ? '' : 'opacity-60'}`}
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={
                  urgent
                    ? 'rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-300'
                    : 'rounded bg-stone-800 px-1.5 py-0.5 text-stone-300'
                }
              >
                {REPORT_TYPE_LABELS[report.report_type]}
              </span>
              <span className="text-stone-500">{timeAgo(report.created_at)}</span>
              {!fresh && (
                <span className="rounded bg-stone-800 px-1.5 py-0.5 text-stone-500">stale</span>
              )}
            </div>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-stone-200">
              {report.body}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
