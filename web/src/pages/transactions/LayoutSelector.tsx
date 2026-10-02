import type { Layout, TransactionPayload } from '../../api/types';
import { inputValue } from './transactionRules';

type LayoutOption = Pick<Layout, 'id' | 'layoutCode' | 'name'>;

interface LayoutSelectorProps {
  form: TransactionPayload;
  layouts: LayoutOption[];
  field: 'layoutId' | 'fromLayoutId' | 'toLayoutId';
  label: string;
  disabled?: boolean;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function LayoutSelector({
  form,
  layouts,
  field,
  label,
  disabled = false,
  onFieldChange,
}: LayoutSelectorProps) {
  return (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
      <span>{label}</span>
      <select
        value={inputValue(form[field])}
        disabled={disabled}
        onChange={event => onFieldChange(field, event.target.value || (null as never))}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
      >
        <option value=''>No layout</option>
        {layouts.map(layout => (
          <option key={layout.id} value={layout.id}>
            {layout.name} ({layout.layoutCode}) · ID {layout.id}
          </option>
        ))}
      </select>
    </label>
  );
}
