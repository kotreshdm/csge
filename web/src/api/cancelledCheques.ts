import { api } from './client';
import type { CancelledCheque, CancelledChequePayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getCancelledCheques() {
  return api<ApiResponse<{ items: CancelledCheque[] }>>({ method: 'GET', url: '/cancelled-cheques' });
}

export function getCancelledCheque(id: string) {
  return api<ApiResponse<CancelledCheque>>({ method: 'GET', url: `/cancelled-cheques/${id}` });
}

export function createCancelledCheque(data: CancelledChequePayload) {
  return api<ApiResponse<CancelledCheque>>({ method: 'POST', url: '/cancelled-cheques', data });
}

export function updateCancelledCheque(id: string, data: CancelledChequePayload) {
  return api<ApiResponse<CancelledCheque>>({ method: 'PUT', url: `/cancelled-cheques/${id}`, data });
}

export function deleteCancelledCheque(id: string) {
  return api<ApiResponse<{ id: string }>>({ method: 'DELETE', url: `/cancelled-cheques/${id}` });
}