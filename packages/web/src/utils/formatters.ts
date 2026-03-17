import type { AccessType, Difficulty, ReportType, Season } from '../types';

export function formatDifficulty(d: Difficulty): string {
  const map: Record<Difficulty, string> = {
    easy: 'Easy',
    moderate: 'Moderate',
    hard: 'Hard',
    expert: 'Expert',
  };
  return map[d];
}

export function formatAccessType(a: AccessType): string {
  const map: Record<AccessType, string> = {
    free: 'Free',
    fee_required: 'Fee Required',
    permit_required: 'Permit Required',
    private: 'Private',
  };
  return map[a];
}

export function formatDistance(mi: number): string {
  return `${mi.toFixed(1)} mi`;
}

export function formatSeason(s: Season): string {
  const map: Record<Season, string> = {
    spring: 'Spring',
    summer: 'Summer',
    fall: 'Fall',
    winter: 'Winter',
    year_round: 'Year Round',
  };
  return map[s];
}

export function formatReportType(r: ReportType): string {
  const map: Record<ReportType, string> = {
    location_inaccurate: 'Location Inaccurate',
    access_blocked: 'Access Blocked',
    temporarily_closed: 'Temporarily Closed',
    unsafe: 'Unsafe Conditions',
    trail_washed_out: 'Trail Washed Out',
    private_property: 'Private Property',
    dangerous_conditions: 'Dangerous Conditions',
    duplicate: 'Duplicate Listing',
    incorrect_info: 'Incorrect Info',
  };
  return map[r];
}
