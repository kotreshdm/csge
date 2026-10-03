import { api } from './client';
import type {
  DashboardSummary,
  DashboardTransactionsPage,
  MemberTransactionReport,
} from './types';

type DashboardFinancialYearsResponse = {
  success: boolean;
  message: string;
  data: {
    items: string[];
  };
};

type DashboardSummaryPeriod =
  | string
  | {
      financialYear?: string;
      fromDate?: string;
      toDate?: string;
    };

export function getFinancialYears() {
  return api<DashboardFinancialYearsResponse>({
    method: 'GET',
    url: '/dashboard/financial-years',
  });
}

export function getDashboardSummary(period: DashboardSummaryPeriod) {
  const params =
    typeof period === 'string'
      ? { financialYear: period }
      : {
          financialYear: period.financialYear || undefined,
          fromDate: period.fromDate || undefined,
          toDate: period.toDate || undefined,
        };

  return api<{
    success: boolean;
    message: string;
    data: DashboardSummary;
  }>({
    method: 'GET',
    url: '/dashboard/summary',
    params,
  });
}

export function getDashboardTransactions(params: {
  financialYear: string;
  page?: number;
  limit?: number;
}) {
  return api<{
    success: boolean;
    message: string;
    data: DashboardTransactionsPage;
  }>({
    method: 'GET',
    url: '/dashboard/transactions',
    params: {
      financialYear: params.financialYear,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
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
