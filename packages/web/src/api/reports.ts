import { apiClient } from './client';
import type { ApiResponse, Report, ReportType } from '../types';

export function createReport(data: {
  locationId: string;
  type: ReportType;
  description: string;
}): Promise<ApiResponse<Report>> {
  return apiClient.post<ApiResponse<Report>>('/reports', data);
}

export function getReports(): Promise<ApiResponse<Report[]>> {
  return apiClient.get<ApiResponse<Report[]>>('/reports');
}

export function updateReport(
  id: string,
  data: { status: string; resolution?: string }
): Promise<ApiResponse<Report>> {
  return apiClient.put<ApiResponse<Report>>(`/reports/${id}`, data);
}
