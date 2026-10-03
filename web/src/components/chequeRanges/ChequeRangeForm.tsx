import { useState, type FormEvent } from 'react';
import type { Account, ChequeRangePayload } from '../../api/types';
import { Button } from '@/components/ui/button';

interface ChequeRangeFormProps {
  accounts: Account[];
  defaultValues?: ChequeRangePayload;
  isSubmitting: boolean;
  submitLabel: string;
  submitMessage?: string;
  onSubmit: (payload: ChequeRangePayload) => void;
  onCancel: () => void;
}

const emptyForm: ChequeRangePayload = {
  accountId: '',
  startChequeNo: '',
  endChequeNo: '',
  receivedDate: new Date().toISOString().slice(0, 10),
  remarks: '',
};

export default function ChequeRangeForm({
  accounts,
  defaultValues = emptyForm,
  isSubmitting,
  submitLabel,
  submitMessage,
  onSubmit,
  onCancel,
}: ChequeRangeFormProps) {
  const [form, setForm] = useState(defaultValues);
  const [validationError, setValidationError] = useState('');

  const updateField = <K extends keyof ChequeRangePayload>(
    field: K,
    value: ChequeRangePayload[K],
  ) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setValidationError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d+$/.test(form.startChequeNo) || !/^\d+$/.test(form.endChequeNo)) {
      setValidationError('Cheque numbers must contain digits only.');
      return;
    }
    if (BigInt(form.startChequeNo) > BigInt(form.endChequeNo)) {
      setValidationError('Starting cheque number cannot exceed ending cheque number.');
      return;
    }
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'
    >
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Bank / cash account *</span>
          <select
            required
            value={form.accountId}
            onChange={event => updateField('accountId', event.target.value)}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            <option value=''>Select account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.accountCode} · {account.name}
              </option>
            ))}
          </select>
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Received date *</span>
          <input
            required
            type='date'
            value={form.receivedDate.slice(0, 10)}
            onChange={event => updateField('receivedDate', event.target.value)}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Starting cheque number *</span>
          <input
            required
            inputMode='numeric'
            value={form.startChequeNo}
            onChange={event => updateField('startChequeNo', event.target.value.trim())}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Ending cheque number *</span>
          <input
            required
            inputMode='numeric'
            value={form.endChequeNo}
            onChange={event => updateField('endChequeNo', event.target.value.trim())}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2'>
          <span>Remarks</span>
          <textarea
            rows={3}
            value={form.remarks}
            onChange={event => updateField('remarks', event.target.value)}
            className='rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
      </div>
      {(validationError || submitMessage) && (
        <p role='alert' className='mt-4 text-sm text-rose-700'>
          {validationError || submitMessage}
        </p>
      )}
      <div className='mt-5 flex justify-end'>
        <Button type='button' variant='outline' disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <span className='w-2' />
        <Button type='submit' disabled={isSubmitting || accounts.length === 0}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
