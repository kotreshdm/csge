import { api } from './client';
import type { Transaction, TransactionPayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getTransactions() {
  return api<ApiResponse<{ items: Transaction[] }>>({ method: 'GET', url: '/transactions' });
}

export function getTransaction(id: string) {
  return api<ApiResponse<Transaction>>({ method: 'GET', url: `/transactions/${id}` });
}

export function createTransaction(data: TransactionPayload) {
  return api<ApiResponse<Transaction>>({ method: 'POST', url: '/transactions', data });
}

export function updateTransaction(id: string, data: TransactionPayload) {
  return api<ApiResponse<Transaction>>({ method: 'PUT', url: `/transactions/${id}`, data });
}

export function deleteTransaction(id: string) {
  return api<ApiResponse<{ id: string }>>({
    method: 'DELETE',
    url: `/transactions/${id}`,
  });
}
