import { api } from './client';
import type { Account, AccountPayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getAccounts() {
  return api<ApiResponse<{ items: Account[] }>>({ method: 'GET', url: '/accounts' });
}

export function getAccount(id: string) {
  return api<ApiResponse<Account>>({ method: 'GET', url: `/accounts/${id}` });
}

export function createAccount(data: AccountPayload) {
  return api<ApiResponse<Account>>({ method: 'POST', url: '/accounts', data });
}

export function updateAccount(id: string, data: AccountPayload) {
  return api<ApiResponse<Account>>({ method: 'PUT', url: `/accounts/${id}`, data });
}

export function deleteAccount(id: string) {
  return api<ApiResponse<{ id: string; accountCode: string; name: string }>>({
    method: 'DELETE',
    url: `/accounts/${id}`,
  });
}
