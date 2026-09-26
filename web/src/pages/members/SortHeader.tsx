import type { SortHeaderProps } from './types';

export function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortHeaderProps) {
  const active = sortBy === field;

  return (
    <button
      type='button'
      onClick={() => onSort(field)}
      className='inline-flex items-center gap-1 font-medium hover:text-slate-900'
    >
      {label}

      <span className='text-xs text-slate-400'>
        {active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}
