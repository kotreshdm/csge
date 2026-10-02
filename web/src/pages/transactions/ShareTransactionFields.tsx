import type { TransactionPayload } from '../../api/types';
import { SHARE_AMOUNT_FIELDS, inputValue } from './transactionRules';

interface ShareTransactionFieldsProps {
  form: TransactionPayload;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function ShareTransactionFields({ form, onFieldChange }: ShareTransactionFieldsProps) {
  const showShareFees = form.direction === 'IN';
  const shareFields: ReadonlyArray<readonly [keyof TransactionPayload, string]> =
    SHARE_AMOUNT_FIELDS;

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {showShareFees ? (
        <>
          {shareFields.map(([name, label]) => (
            <label key={String(name)} className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>{label}</span>
              <input
                type='number'
                min='0'
                step='1'
                value={inputValue(form[name])}
                onChange={event => onFieldChange(name, event.target.value as never)}
                className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
          ))}
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            <span>Total amount</span>
            <input
              type='number'
              min='0'
              step='1'
              value={inputValue(form.totalAmount)}
              readOnly
              className='h-9 min-w-0 rounded-md border border-slate-300 bg-slate-100 px-2.5 font-normal text-slate-900 outline-none'
            />
          </label>
        </>
      ) : (
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Share amount</span>
          <input
            type='number'
            min='0'
            step='1'
            value={inputValue(form.shareAmount)}
            onChange={event => onFieldChange('shareAmount', event.target.value as never)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
      )}
    </div>
  );
}
