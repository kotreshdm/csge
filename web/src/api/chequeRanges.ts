import { api } from './client';
import type { ChequeRange, ChequeRangePayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getChequeRanges() {
  return api<ApiResponse<{ items: ChequeRange[] }>>({ method: 'GET', url: '/cheque-ranges' });
}

export function getChequeRange(id: string) {
  return api<ApiResponse<ChequeRange>>({ method: 'GET', url: `/cheque-ranges/${id}` });
}

export function createChequeRange(data: ChequeRangePayload) {
  return api<ApiResponse<ChequeRange>>({ method: 'POST', url: '/cheque-ranges', data });
}

export function updateChequeRange(id: string, data: ChequeRangePayload) {
  return api<ApiResponse<ChequeRange>>({ method: 'PUT', url: `/cheque-ranges/${id}`, data });
}

export function deleteChequeRange(id: string) {
  return api<ApiResponse<{ id: string }>>({ method: 'DELETE', url: `/cheque-ranges/${id}` });
}
