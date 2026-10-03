import type { DashboardSummaryMonthlyEntry } from '../../api/types';

interface ProfitLossChartProps {
  data: DashboardSummaryMonthlyEntry[];
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
  if (!data.length) {
    return (
      <div className='flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500'>
        No profit/loss trend data for this financial year.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((row) => Math.abs(Number(row.profitLoss || 0))),
    1,
  );

  return (
    <div className='flex h-64 items-end gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3'>
      {data.map((row) => {
        const value = Number(row.profitLoss || 0);
        const percent = Math.abs(value) / maxValue;

        return (
          <div key={row.key} className='flex flex-1 flex-col items-center gap-2'>
            <div className='flex h-full w-full items-end justify-center'>
              <div
                className={`w-full rounded-t-md ${value >= 0 ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}
                style={{ height: `${Math.max(percent * 100, 4)}%` }}
                title={`${row.label}: ${row.profitLoss}`}
              />
            </div>
            <span className='text-[10px] font-medium text-slate-500'>{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}
