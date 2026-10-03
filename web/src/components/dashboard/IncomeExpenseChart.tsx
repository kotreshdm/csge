import type { DashboardSummaryMonthlyEntry } from '../../api/types';

interface IncomeExpenseChartProps {
  data: DashboardSummaryMonthlyEntry[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (!data.length) {
    return (
      <div className='flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500'>
        No income/expense data for this financial year.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((row) => [Number(row.income || 0), Number(row.expense || 0)]),
    1,
  );

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4 text-xs font-medium text-slate-500'>
        <div className='flex items-center gap-2'>
          <span className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
          Income
        </div>
        <div className='flex items-center gap-2'>
          <span className='h-2.5 w-2.5 rounded-full bg-sky-500' />
          Expense
        </div>
      </div>

      <div className='flex h-64 items-end gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3'>
        {data.map((item) => (
          <div key={item.key} className='flex flex-1 flex-col items-center gap-2'>
            <div className='flex h-full w-full items-end justify-center gap-1'>
              <div
                className='w-1/2 rounded-t-md bg-emerald-500/90 shadow-sm'
                style={{ height: `${(Number(item.income || 0) / maxValue) * 100}%` }}
                title={`Income ${item.label}: ${item.income}`}
              />
              <div
                className='w-1/2 rounded-t-md bg-sky-500/90 shadow-sm'
                style={{ height: `${(Number(item.expense || 0) / maxValue) * 100}%` }}
                title={`Expense ${item.label}: ${item.expense}`}
              />
            </div>
            <span className='text-[10px] font-medium text-slate-500'>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
