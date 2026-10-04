import { useState, type FormEvent } from 'react';
import type { Party, CancelledChequePayload } from '../../api/types';
import { Button } from '@/components/ui/button';

interface CancelledChequeFormProps {
  parties: Party[];
  defaultValues?: CancelledChequePayload;
  isSubmitting: boolean;
  submitLabel: string;
  submitMessage?: string;
  onSubmit: (payload: CancelledChequePayload) => void;
  onCancel: () => void;
}

const emptyForm: CancelledChequePayload = {
  partyId: '',
  chequeNo: '',
  cancelledDate: new Date().toISOString().slice(0, 10),
  reason: '',
  remarks: '',
};

export default function CancelledChequeForm({
  parties,
  defaultValues = emptyForm,
  isSubmitting,
  submitLabel,
  submitMessage,
  onSubmit,
  onCancel,
}: CancelledChequeFormProps) {
  const [form, setForm] = useState(defaultValues);
  const [validationError, setValidationError] = useState('');

  const updateField = <K extends keyof CancelledChequePayload>(
    field: K,
    value: CancelledChequePayload[K],
  ) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setValidationError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d+$/.test(form.chequeNo)) {
      setValidationError('Cheque number must contain digits only.');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className='rounded-lg border border-slate-200 bg-white p-5 shadow-sm'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Party *</span>
          <select
            required
            value={form.partyId}
            onChange={event => updateField('partyId', event.target.value)}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            <option value=''>Select party</option>
            {parties.map(party => (
              <option key={party.id} value={party.id}>
                {party.name} · {party.partyType}
              </option>
            ))}
          </select>
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Cheque number *</span>
          <input
            required
            inputMode='numeric'
            value={form.chequeNo}
            onChange={event => updateField('chequeNo', event.target.value.trim())}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Cancelled date *</span>
          <input
            required
            type='date'
            value={form.cancelledDate.slice(0, 10)}
            onChange={event => updateField('cancelledDate', event.target.value)}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>Reason</span>
          <input
            value={form.reason}
            onChange={event => updateField('reason', event.target.value)}
            className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          />
        </label>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2'>
          <span>Remarks</span>
          <textarea
            rows={2}
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
      <div className='mt-5 flex justify-end gap-2'>
        <Button type='button' variant='outline' disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting || parties.length === 0}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}