import { apiClient } from './client';
import type { ApiResponse, User } from '../types';

export interface AuthPayload {
  user: User;
  token: string;
}

export function login(email: string, password: string): Promise<ApiResponse<AuthPayload>> {
  return apiClient.post<ApiResponse<AuthPayload>>('/auth/login', { email, password });
}

export function register(
  displayName: string,
  email: string,
  password: string
): Promise<ApiResponse<AuthPayload>> {
  return apiClient.post<ApiResponse<AuthPayload>>('/auth/register', { displayName, email, password });
}

export function getMe(): Promise<ApiResponse<User>> {
  return apiClient.get<ApiResponse<User>>('/users/me');
}

export function updateMe(data: Partial<Pick<User, 'displayName' | 'avatarUrl'>>): Promise<ApiResponse<User>> {
  return apiClient.put<ApiResponse<User>>('/users/me', data);
}
