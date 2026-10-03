import type { Layout, TransactionPayload } from '../../api/types';
import { inputValue } from './transactionRules';
import { LayoutSelector } from './LayoutSelector';

type LayoutOption = Pick<Layout, 'id' | 'layoutCode' | 'name'>;

interface LayoutTransactionFieldsProps {
  form: TransactionPayload;
  layouts: LayoutOption[];
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function LayoutTransactionFields({
  form,
  layouts,
  onFieldChange,
}: LayoutTransactionFieldsProps) {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <LayoutSelector
        form={form}
        layouts={layouts}
        field='layoutId'
        label='Layout'
        onFieldChange={onFieldChange}
      />
      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Site deposit amount</span>
        <input
          type='number'
          min='0'
          step='0.01'
          value={inputValue(form.siteDepositAmount)}
          onChange={event => onFieldChange('siteDepositAmount', event.target.value as never)}
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
        />
      </label>
    </div>
  );
}
