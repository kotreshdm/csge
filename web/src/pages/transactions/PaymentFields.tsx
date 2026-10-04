import type { TransactionPayload } from '../../api/types';
import { getPaymentModeOptions, inputValue } from './transactionRules';

interface PaymentFieldsProps {
  form: TransactionPayload;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function PaymentFields({ form, onFieldChange }: PaymentFieldsProps) {
  const paymentModeOptions = getPaymentModeOptions();

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Payment mode</span>
        <select
          value={form.paymentMode ?? ''}
          onChange={event =>
            onFieldChange(
              'paymentMode',
              (event.target.value || null) as TransactionPayload['paymentMode'],
            )
          }
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
        >
          <option value=''>No payment mode</option>
          {paymentModeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Receipt number</span>
        <input
          type='text'
          value={inputValue(form.receiptNo)}
          onChange={event =>
            onFieldChange(
              'receiptNo',
              (event.target.value || null) as TransactionPayload['receiptNo'],
            )
          }
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
        />
      </label>

      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Cheque number</span>
        <input
          type='text'
          required={form.paymentMode === 'CHEQUE'}
          value={inputValue(form.chequeNo)}
          onChange={event =>
            onFieldChange(
              'chequeNo',
              (event.target.value || null) as TransactionPayload['chequeNo'],
            )
          }
          disabled={form.paymentMode !== 'CHEQUE'}
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
        />
      </label>

      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Cheque date</span>
        <input
          type='date'
          required={form.paymentMode === 'CHEQUE'}
          value={inputValue(form.chequeDate)}
          onChange={event =>
            onFieldChange(
              'chequeDate',
              (event.target.value || null) as TransactionPayload['chequeDate'],
            )
          }
          disabled={form.paymentMode !== 'CHEQUE'}
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
        />
      </label>

      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
        <span>Bank reference</span>
        <input
          type='text'
          required={form.paymentMode === 'BANK_TRANSFER'}
          value={inputValue(form.bankReferenceNo)}
          onChange={event =>
            onFieldChange(
              'bankReferenceNo',
              (event.target.value || null) as TransactionPayload['bankReferenceNo'],
            )
          }
          disabled={form.paymentMode !== 'BANK_TRANSFER'}
          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
        />
      </label>
    </div>
  );
}
