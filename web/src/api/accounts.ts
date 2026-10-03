import { api } from './client';
import type { Account, AccountPayload, AccountStatementReport } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getAccounts() {
  return api<ApiResponse<{ items: Account[] }>>({ method: 'GET', url: '/accounts' });
}

export function getAccountStatements(params: {
  accountId?: string;
  financialYear?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) {
  return api<ApiResponse<AccountStatementReport>>({
    method: 'GET',
    url: '/accounts/statements',
    params: {
      accountId: params.accountId || undefined,
      financialYear: params.financialYear || undefined,
      fromDate: params.fromDate || undefined,
      toDate: params.toDate || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
    },
  });
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
