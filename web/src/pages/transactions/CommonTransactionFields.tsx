import type { ReactNode } from 'react';
import type { TransactionPayload } from '../../api/types';
import { getAllowedDirections, getAllowedTypes, getSubtypeOptions, inputValue } from './transactionRules';

interface CommonTransactionFieldsProps {
  form: TransactionPayload;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
  onDirectionChange: (value: TransactionPayload['direction']) => void;
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
  onFieldChange,
  onDirectionChange,
  onTypeChange,
}: CommonTransactionFieldsProps) {
  const subtypeOptions = getSubtypeOptions(form.type);
  const allowedDirections = getAllowedDirections(form.type);
  const allowedTypes = getAllowedTypes(form.direction);

  return (
    <section>
      <div className='mb-3 flex items-center gap-2 border-b border-slate-200 pb-2'>
        <span aria-hidden='true' className='h-4 w-1 rounded-sm bg-teal-700' />
        <h2 className='text-sm font-semibold text-slate-800'>Transaction</h2>
      </div>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <FieldLabel label='Cashbook number' required>
          <input
            type='number'
            min='1'
            step='1'
            value={inputValue(form.cashbookNo)}
            onChange={event => onFieldChange('cashbookNo', event.target.value as never)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </FieldLabel>

        <FieldLabel label='Cashbook page' required>
          <input
            type='number'
            min='1'
            step='1'
            value={inputValue(form.cashbookPage)}
            onChange={event => onFieldChange('cashbookPage', event.target.value as never)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </FieldLabel>

        <FieldLabel label='Date' required>
          <input
            type='date'
            value={inputValue(form.transactionDate)}
            onChange={event => onFieldChange('transactionDate', event.target.value as never)}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </FieldLabel>

        <FieldLabel label='Direction' required>
          <select
            value={form.direction}
            onChange={event =>
              onDirectionChange(event.target.value as TransactionPayload['direction'])
            }
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            {(['IN', 'OUT', 'TRANSFER'] as const)
              .filter(direction => allowedDirections.includes(direction))
              .map(direction => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
          </select>
        </FieldLabel>

        <FieldLabel label='Type' required>
          <select
            value={form.type}
            onChange={event => onTypeChange(event.target.value as TransactionPayload['type'])}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            {(['SHARE', 'LAYOUT', 'BANK', 'EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'] as const)
              .filter(type => allowedTypes.includes(type))
              .map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>
        </FieldLabel>

        {subtypeOptions.length > 0 ? (
          <FieldLabel label='Sub-type' required>
            <select
              value={inputValue(form.subType)}
              onChange={event => onFieldChange('subType', event.target.value as never)}
              className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
            >
              <option value=''>Select sub-type</option>
              {subtypeOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FieldLabel>
        ) : null}
      </div>
    </section>
  );
}
