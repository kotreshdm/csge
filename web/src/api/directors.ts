import { api } from './client';
import type { Director, DirectorPayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getDirectors() {
  return api<ApiResponse<{ items: Director[] }>>({ method: 'GET', url: '/directors' });
}

export function createDirector(data: DirectorPayload) {
  return api<ApiResponse<Director>>({ method: 'POST', url: '/directors', data });
}

export function updateDirector(id: string, data: DirectorPayload) {
  return api<ApiResponse<Director>>({ method: 'PUT', url: `/directors/${id}`, data });
}

export function deleteDirector(id: string) {
  return api<ApiResponse<{ id: string }>>({ method: 'DELETE', url: `/directors/${id}` });
}
