import 'server-only';
import { getServiceClient } from '@/lib/db/client';
import type { LocationReport, ReportType } from '@/lib/types';

export async function insertReport(input: {
  location_id: string;
  user_id: string;
  report_type: ReportType;
  body: string;
}): Promise<LocationReport> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const { data, error } = await db.from('location_report').insert(input).select('*').single();
  if (error) throw new Error(`insertReport: ${error.message}`);
  return data as LocationReport;
}

export async function deleteReport(id: string): Promise<void> {
  const db = getServiceClient();
  if (!db) throw new Error('Database not configured');
  const { error } = await db.from('location_report').delete().eq('id', id);
  if (error) throw new Error(`deleteReport: ${error.message}`);
}

export async function listRecentReports(limit = 50): Promise<LocationReport[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from('location_report')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listRecentReports: ${error.message}`);
  return (data ?? []) as LocationReport[];
}
