interface FinancialYearSelectorProps {
  value: string;
  years: string[];
  onChange: (nextYear: string) => void;
  loading?: boolean;
}

export function FinancialYearSelector({
  value,
  years,
  onChange,
  loading = false,
}: FinancialYearSelectorProps) {
  return (
    <div className='flex flex-col gap-2'>
      <label className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
        Financial Year
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || years.length === 0}
        className='w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[220px]'
      >
        {years.length === 0 ? (
          <option value=''>No financial year available</option>
        ) : (
          years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
