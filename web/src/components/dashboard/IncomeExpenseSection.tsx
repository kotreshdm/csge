import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAmountItem, DashboardSummary } from '../../api/types';
import { formatDashboardCurrency } from './dashboardFormatting';

export function IncomeExpenseSection({
  income,
  expense,
  summary,
}: {
  income: DashboardAmountItem[];
  expense: DashboardAmountItem[];
  summary: DashboardSummary['summary'];
}) {
  return (
    <section aria-label='Income and expense breakdown' className='grid gap-4 lg:grid-cols-2'>
      <Breakdown
        title='Income Breakdown'
        items={income}
        total={summary.totalIncome}
        tone='income'
      />
      <Breakdown
        title='Expense Breakdown'
        items={expense}
        total={summary.totalExpense}
        tone='expense'
      />
      <Card className='lg:col-span-2'>
        <CardHeader>
          <CardTitle>Welfare Fund</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 p-4 sm:grid-cols-2'>
          <div>
            <p className='text-xs font-semibold uppercase text-emerald-700'>
              Received this financial year
            </p>
            <p className='mt-2 text-xl font-bold text-emerald-800'>
              {formatDashboardCurrency(summary.welfareFund)}
            </p>
          </div>
          <div>
            <p className='text-xs font-semibold uppercase text-emerald-700'>Contributing members</p>
            <p className='mt-2 text-xl font-bold text-emerald-800'>
              {summary.welfareContributorCount}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Breakdown({
  title,
  items,
  total,
  tone,
}: {
  title: string;
  items: DashboardAmountItem[];
  total: string;
  tone: 'income' | 'expense';
}) {
  const color = tone === 'income' ? 'text-emerald-700' : 'text-rose-700';
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className='divide-y divide-slate-100'>
            {items.map(item => (
              <div key={item.label} className='flex items-center justify-between gap-3 py-2.5'>
                <span className='text-sm text-slate-700'>{item.label}</span>
                <span className={`whitespace-nowrap text-sm font-semibold ${color}`}>
                  {formatDashboardCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className='py-4 text-sm text-slate-500'>No {tone} recorded for this financial year.</p>
        )}
        <div className='mt-3 flex items-center justify-between border-t border-slate-200 pt-3 font-semibold'>
          <span>Total {tone === 'income' ? 'Income' : 'Expense'}</span>
          <span className={color}>{formatDashboardCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
