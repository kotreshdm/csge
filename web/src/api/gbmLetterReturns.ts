import { api } from './client';
import type { GbmLetterReturn, GbmLetterReturnPayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getGbmLetterReturns() {
  return api<ApiResponse<{ items: GbmLetterReturn[] }>>({
    method: 'GET',
    url: '/gbm-letter-returns',
  });
}

export function createGbmLetterReturn(data: GbmLetterReturnPayload) {
  return api<ApiResponse<GbmLetterReturn>>({ method: 'POST', url: '/gbm-letter-returns', data });
}

export function updateGbmLetterReturn(id: string, data: GbmLetterReturnPayload) {
  return api<ApiResponse<GbmLetterReturn>>({
    method: 'PUT',
    url: `/gbm-letter-returns/${id}`,
    data,
  });
}

export function deleteGbmLetterReturn(id: string) {
  return api<ApiResponse<{ id: string }>>({ method: 'DELETE', url: `/gbm-letter-returns/${id}` });
}
