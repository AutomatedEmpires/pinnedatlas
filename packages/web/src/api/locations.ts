import { apiClient } from './client';
import type { ApiResponse, Location, LocationsQuery, PaginatedResponse } from '../types';

export function getLocations(query: LocationsQuery = {}): Promise<PaginatedResponse<Location>> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.difficulty) params.set('difficulty', query.difficulty);
  if (query.swimAllowed !== undefined) params.set('swimAllowed', String(query.swimAllowed));
  if (query.q) params.set('q', query.q);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.bounds) {
    params.set('bounds', `${query.bounds.north},${query.bounds.south},${query.bounds.east},${query.bounds.west}`);
  }
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<Location>>(`/locations${qs ? `?${qs}` : ''}`);
}

export function getLocation(id: string): Promise<ApiResponse<Location>> {
  return apiClient.get<ApiResponse<Location>>(`/locations/${id}`);
}

export function createLocation(data: {
  title: string;
  category: string;
  coordinates: { lat: number; lng: number };
  description: string;
  difficulty: string;
  accessType: string;
}): Promise<ApiResponse<Location>> {
  return apiClient.post<ApiResponse<Location>>('/locations', data);
}
