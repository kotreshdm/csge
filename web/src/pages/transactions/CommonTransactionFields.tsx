import type { ReactNode } from 'react';
import type { TransactionPayload } from '../../api/types';
import { TRANSACTION_TYPES } from './transactionConstants';
import { getTransactionSubtypes, inputValue } from './transactionRules';

interface CommonTransactionFieldsProps {
  form: TransactionPayload;
  otherFieldsDisabled: boolean;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
  onTypeChange: (value: TransactionPayload['type']) => void;
}

function FieldLabel({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
      <span>
        {label}
        {required ? <span className='ml-1 text-rose-600'>*</span> : null}
      </span>
      {children}
    </label>
  );
}

export function CommonTransactionFields({
  form,
  otherFieldsDisabled,
  onFieldChange,
  onTypeChange,
}: CommonTransactionFieldsProps) {
  const availableSubtypes = getTransactionSubtypes(form.type);

  return (
    <section>
      <div className='mb-3 flex items-center gap-2 border-b border-slate-200 pb-2'>
        <span aria-hidden='true' className='h-4 w-1 rounded-sm bg-teal-700' />
        <h2 className='text-sm font-semibold text-slate-800'>Transaction</h2>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <FieldLabel label='Date' required>
          <input
            type='date'
            value={inputValue(form.transactionDate)}
            onChange={event => onFieldChange('transactionDate', event.target.value)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </FieldLabel>
        <FieldLabel label='Type' required>
          <select
            value={form.type}
            onChange={event => onTypeChange(event.target.value as TransactionPayload['type'])}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            {TRANSACTION_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label='Sub-type' required>
          <select
            required
            value={inputValue(form.subType)}
            onChange={event => onFieldChange('subType', event.target.value)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            <option value='' disabled>
              Select sub-type
            </option>
            {availableSubtypes.map(subtype => (
              <option key={subtype} value={subtype}>
                {subtype}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label='Cashbook number'>
          <input
            type='number'
            min='1'
            step='1'

            value={inputValue(form.cashbookNo)}
            onChange={event => onFieldChange('cashbookNo', event.target.value)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
          />
        </FieldLabel>
        <FieldLabel label='Cashbook page'>
          <input
            type='number'
            min='1'
            step='1'

            value={inputValue(form.cashbookPage)}
            onChange={event => onFieldChange('cashbookPage', event.target.value)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
          />
        </FieldLabel>
      </div>
    </section>
  );
}
