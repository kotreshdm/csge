import type { TransactionPayload } from '../../api/types';
import { TRANSACTION_AMOUNT_FIELDS } from './transactionConstants';
import type { TransactionFieldConfig } from './transactionRules';
import { inputValue } from './transactionRules';

interface TransactionAmountFieldsProps {
  form: TransactionPayload;
  config: TransactionFieldConfig;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function TransactionAmountFields({
  form,
  config,
  onFieldChange,
}: TransactionAmountFieldsProps) {
  const labels = new Map(TRANSACTION_AMOUNT_FIELDS);

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {config.amountFields.map(field => (
        <label key={field} className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>
            {field === 'otherAmount' && config.amountFields.length === 1
              ? 'Amount'
              : labels.get(field) ?? field}
          </span>
          <input
            type='number'
            min='0'
            step='0.01'
            value={inputValue(form[field])}
            onChange={event => onFieldChange(field, event.target.value)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
      ))}
      {config.showTotalAmount ? (
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Total amount</span>
          <input
            type='number'
            value={inputValue(form.totalAmount)}
            readOnly
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-slate-100 px-2.5 font-normal text-slate-900 outline-none'
          />
        </label>
      ) : null}
    </div>
  );
}
