import { api } from './client';
import type { CancelledReceipt, CancelledReceiptPayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getCancelledReceipts() {
  return api<ApiResponse<{ items: CancelledReceipt[] }>>({
    method: 'GET',
    url: '/cancelled-receipts',
  });
}

export function createCancelledReceipt(data: CancelledReceiptPayload) {
  return api<ApiResponse<CancelledReceipt>>({ method: 'POST', url: '/cancelled-receipts', data });
}

export function updateCancelledReceipt(id: string, data: CancelledReceiptPayload) {
  return api<ApiResponse<CancelledReceipt>>({
    method: 'PUT',
    url: `/cancelled-receipts/${id}`,
    data,
  });
}

export function deleteCancelledReceipt(id: string) {
  return api<ApiResponse<{ id: string }>>({ method: 'DELETE', url: `/cancelled-receipts/${id}` });
}
