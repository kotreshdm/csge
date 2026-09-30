type SortHeaderProps<Field extends string> = {
  label: string;
  field: Field;
  sortBy: Field;
  sortOrder: 'asc' | 'desc';
  onSort: (field: Field) => void;
};

export function SortHeader<Field extends string>({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortHeaderProps<Field>) {
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