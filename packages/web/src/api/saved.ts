import { apiClient } from './client';
import type { ApiResponse, Location } from '../types';

export function getSaved(): Promise<ApiResponse<Location[]>> {
  return apiClient.get<ApiResponse<Location[]>>('/saved');
}

export function saveLocation(locationId: string): Promise<ApiResponse<unknown>> {
  return apiClient.post<ApiResponse<unknown>>(`/saved/${locationId}`);
}

export function unsaveLocation(locationId: string): Promise<ApiResponse<unknown>> {
  return apiClient.delete<ApiResponse<unknown>>(`/saved/${locationId}`);
}
