import type { FinancialPeriodMode } from '../../models/financialReport';

interface PeriodFilterProps {
  mode: FinancialPeriodMode;
  financialYear: string;
  years: string[];
  customFromDate: string;
  customToDate: string;
  onModeChange: (mode: FinancialPeriodMode) => void;
  onFinancialYearChange: (value: string) => void;
  onCustomFromDateChange: (value: string) => void;
  onCustomToDateChange: (value: string) => void;
  loading?: boolean;
}

export function PeriodFilter({
  mode,
  financialYear,
  years,
  customFromDate,
  customToDate,
  onModeChange,
  onFinancialYearChange,
  onCustomFromDateChange,
  onCustomToDateChange,
  loading = false,
}: PeriodFilterProps) {
  return (
    <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.16em] text-slate-500'>Period</h3>
      </div>

      <div className='grid gap-4 md:grid-cols-[220px_1fr]'>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          Period type
          <select
            value={mode}
            onChange={event => onModeChange(event.target.value as FinancialPeriodMode)}
            disabled={loading}
            className='h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
          >
            <option value='financialYear'>Financial Year</option>
            <option value='custom'>Custom Date Range</option>
          </select>
        </label>

        {mode === 'financialYear' ? (
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            Financial Year
            <select
              value={financialYear}
              onChange={event => onFinancialYearChange(event.target.value)}
              disabled={loading || years.length === 0}
              className='h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
            >
              {years.length === 0 ? (
                <option value=''>No financial year available</option>
              ) : (
                years.map(year => (
                  <option key={year} value={year}>
                    FY {year}
                  </option>
                ))
              )}
            </select>
          </label>
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              From date
              <input
                type='date'
                value={customFromDate}
                onChange={event => onCustomFromDateChange(event.target.value)}
                disabled={loading}
                className='h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
              />
            </label>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              To date
              <input
                type='date'
                value={customToDate}
                min={customFromDate}
                onChange={event => onCustomToDateChange(event.target.value)}
                disabled={loading}
                className='h-10 rounded-md border border-slate-300 bg-white px-2.5 text-sm focus:border-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
