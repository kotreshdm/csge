import { api } from './client';
import type { DashboardSummary, MemberTransactionReport } from './types';

type DashboardFinancialYearsResponse = {
  success: boolean;
  message: string;
  data: {
    items: string[];
  };
};

export function getFinancialYears() {
  return api<DashboardFinancialYearsResponse>({
    method: 'GET',
    url: '/dashboard/financial-years',
  });
}

export function getDashboardSummary(financialYear: string) {
  return api<{
    success: boolean;
    message: string;
    data: DashboardSummary;
  }>({
    method: 'GET',
    url: '/dashboard/summary',
    params: { financialYear },
  });
}

export function getMemberTransactions(
  memberId: string,
  params: {
    financialYear: string;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  },
) {
  return api<{
    success: boolean;
    message: string;
    data: MemberTransactionReport;
  }>({
    method: 'GET',
    url: `/members/${memberId}/transactions`,
    params: {
      financialYear: params.financialYear,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      sortOrder: params.sortOrder ?? 'desc',
      search: params.search || undefined,
    },
  });
}
