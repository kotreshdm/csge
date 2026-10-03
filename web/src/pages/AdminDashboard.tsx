import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Landmark, PiggyBank, ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards';
import { FinancialYearSelector } from '../components/dashboard/FinancialYearSelector';
import { IncomeExpenseChart } from '../components/dashboard/IncomeExpenseChart';
import { ProfitLossChart } from '../components/dashboard/ProfitLossChart';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { getDashboardSummary, getFinancialYears } from '../api/dashboard';

function getCurrentFinancialYear() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearStart = today.getMonth() >= 3 ? currentYear : currentYear - 1;
  return `${yearStart}-${yearStart + 1}`;
}

function formatCurrency(value: string | undefined | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const defaultFinancialYear = getCurrentFinancialYear();
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(defaultFinancialYear);

  const financialYearsQuery = useQuery({
    queryKey: ['dashboard-financial-years'],
    queryFn: getFinancialYears,
    staleTime: 60_000,
  });

  const availableFinancialYears = financialYearsQuery.data?.data.items ?? [defaultFinancialYear];

  useEffect(() => {
    if (!selectedFinancialYear || !availableFinancialYears.includes(selectedFinancialYear)) {
      setSelectedFinancialYear(availableFinancialYears[0] ?? defaultFinancialYear);
    }
  }, [availableFinancialYears, defaultFinancialYear, selectedFinancialYear]);

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary', selectedFinancialYear],
    queryFn: () => getDashboardSummary(selectedFinancialYear),
    enabled: Boolean(selectedFinancialYear),
    staleTime: 60_000,
  });

  const dashboardData = summaryQuery.data?.data;
  const summary = dashboardData?.summary;
  const monthly = dashboardData?.monthly ?? [];
  const recentTransactions = dashboardData?.recentTransactions ?? [];

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <header className='flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>
              Cooperative Dashboard
            </p>
            <h1 className='mt-2 text-3xl font-bold tracking-tight text-slate-900'>Dashboard</h1>
          </div>

          <FinancialYearSelector
            value={selectedFinancialYear}
            years={availableFinancialYears}
            onChange={setSelectedFinancialYear}
            loading={financialYearsQuery.isLoading || summaryQuery.isLoading}
          />
        </header>

        {summaryQuery.isLoading ? (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-200'
              />
            ))}
          </div>
        ) : summary ? (
          <DashboardSummaryCards
            financialYear={dashboardData?.financialYear ?? selectedFinancialYear}
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            profitLoss={summary.profitLoss}
            totalLiability={summary.totalLiability}
            totalMemberShare={summary.totalMemberShare}
            totalSiteDeposit={summary.totalSiteDeposit}
          />
        ) : null}

        {!summaryQuery.isLoading && summary && (
          <section className='grid gap-6 xl:grid-cols-[1.6fr_1fr]'>
            <Card className='h-full'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Income vs Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart data={monthly} />
              </CardContent>
            </Card>

            <Card className='h-full'>
              <CardHeader>
                <CardTitle>Profit & Loss</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-3'>
                  <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
                    <p className='text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700'>
                      Income
                    </p>
                    <p className='mt-2 text-xl font-bold text-emerald-900'>
                      {formatCurrency(summary.totalIncome)}
                    </p>
                  </div>
                  <div className='rounded-xl border border-sky-200 bg-sky-50 p-3'>
                    <p className='text-xs font-semibold uppercase tracking-[0.14em] text-sky-700'>
                      Expense
                    </p>
                    <p className='mt-2 text-xl font-bold text-sky-900'>
                      {formatCurrency(summary.totalExpense)}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border p-3 ${
                      Number(summary.profitLoss || 0) >= 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border-rose-200 bg-rose-50 text-rose-900'
                    }`}
                  >
                    <p className='text-xs font-semibold uppercase tracking-[0.14em]'>
                      {Number(summary.profitLoss || 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                    </p>
                    <p className='mt-2 text-xl font-bold'>{formatCurrency(summary.profitLoss)}</p>
                  </div>
                </div>
                <ProfitLossChart data={monthly} />
              </CardContent>
            </Card>
          </section>
        )}

        {!summaryQuery.isLoading && summary && (
          <section className='grid gap-6 xl:grid-cols-[0.95fr_1.7fr]'>
            <Card>
              <CardHeader>
                <CardTitle>Member Financial Position</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center gap-2 text-slate-600'>
                      <PiggyBank className='h-4 w-4' />
                      <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
                        Total Share
                      </span>
                    </div>
                    <p className='mt-3 text-2xl font-bold text-slate-900'>
                      {formatCurrency(summary.totalMemberShare)}
                    </p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center gap-2 text-slate-600'>
                      <ShieldCheck className='h-4 w-4' />
                      <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
                        Site Deposit
                      </span>
                    </div>
                    <p className='mt-3 text-2xl font-bold text-slate-900'>
                      {formatCurrency(summary.totalSiteDeposit)}
                    </p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center gap-2 text-slate-600'>
                      <ArrowUpRight className='h-4 w-4' />
                      <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
                        Share Members
                      </span>
                    </div>
                    <p className='mt-3 text-2xl font-bold text-slate-900'>
                      {summary.shareMemberCount}
                    </p>
                  </div>
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-3'>
                    <div className='flex items-center gap-2 text-slate-600'>
                      <ArrowDownRight className='h-4 w-4' />
                      <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
                        Site Deposit Members
                      </span>
                    </div>
                    <p className='mt-3 text-2xl font-bold text-slate-900'>
                      {summary.siteDepositMemberCount}
                    </p>
                  </div>
                </div>

                <div className='rounded-xl border border-cyan-200 bg-cyan-50 p-3'>
                  <div className='flex items-center gap-2 text-cyan-700'>
                    <Landmark className='h-4 w-4' />
                    <span className='text-xs font-semibold uppercase tracking-[0.16em]'>
                      Total Liability
                    </span>
                  </div>
                  <p className='mt-2 text-2xl font-bold text-cyan-900'>
                    {formatCurrency(summary.totalLiability)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <RecentTransactions
              transactions={recentTransactions}
              loading={summaryQuery.isLoading}
            />
          </section>
        )}

        {summaryQuery.isError && (
          <Card className='border-rose-200 bg-rose-50 text-rose-700'>
            <CardContent className='p-4 text-sm font-medium'>
              Unable to load dashboard data for the selected financial year. Please try again.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
