import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getDashboardSummary, getDashboardTransactions, getFinancialYears } from '../api/dashboard';
import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards';
import { DashboardTransactionsTable } from '../components/dashboard/DashboardTransactionsTable';
import { getCurrentFinancialYear } from '../models/financialReport';

function formatFinancialYear(value: string) {
  const [start, end] = value.split('-');
  return end ? `${start}-${end.slice(-2)}` : value;
}

export default function AdminDashboard() {
  const defaultFinancialYear = getCurrentFinancialYear();
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [transactionPage, setTransactionPage] = useState(1);

  const financialYearsQuery = useQuery({
    queryKey: ['dashboard-financial-years'],
    queryFn: getFinancialYears,
    staleTime: 60_000,
  });
  const financialYears = financialYearsQuery.data?.data.items ?? [defaultFinancialYear];

  useEffect(() => {
    if (!financialYears.includes(financialYear)) {
      setFinancialYear(financialYears[0] ?? defaultFinancialYear);
    }
  }, [defaultFinancialYear, financialYear, financialYears]);

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', financialYear],
    queryFn: () => getDashboardSummary(financialYear),
    enabled: Boolean(financialYear),
    staleTime: 60_000,
  });
  const transactionsQuery = useQuery({
    queryKey: ['dashboard-transactions', financialYear, transactionPage],
    queryFn: () => getDashboardTransactions({ financialYear, page: transactionPage, limit: 20 }),
    enabled: Boolean(financialYear),
    staleTime: 30_000,
  });

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-8'>
        <header className='flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p className='text-sm font-medium text-emerald-800'>Cooperative</p>
            <h1 className='mt-1 text-2xl font-semibold text-slate-950'>Dashboard</h1>
          </div>
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            Financial Year
            <select
              value={financialYear}
              onChange={event => {
                setFinancialYear(event.target.value);
                setTransactionPage(1);
              }}
              disabled={financialYearsQuery.isLoading || financialYears.length === 0}
              className='h-10 min-w-48 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
            >
              {financialYears.map(year => (
                <option key={year} value={year}>
                  FY {formatFinancialYear(year)}
                </option>
              ))}
            </select>
          </label>
        </header>

        {summaryQuery.isLoading ? (
          <p className='py-6 text-sm text-slate-500'>Loading dashboard summary...</p>
        ) : summaryQuery.data ? (
          <DashboardSummaryCards summary={summaryQuery.data.data.summary} />
        ) : summaryQuery.isError ? (
          <p role='alert' className='py-4 text-sm text-rose-700'>
            Unable to load dashboard summary for FY {formatFinancialYear(financialYear)}.
          </p>
        ) : null}

        <DashboardTransactionsTable
          financialYear={formatFinancialYear(financialYear)}
          transactions={transactionsQuery.data?.data}
          loading={transactionsQuery.isLoading}
          error={transactionsQuery.isError}
          page={transactionPage}
          onPageChange={setTransactionPage}
        />
      </div>
    </main>
  );
}
