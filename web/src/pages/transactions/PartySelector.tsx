import type { Party, TransactionPayload } from '../../api/types';
import { inputValue } from './transactionRules';

type PartyOption = Pick<Party, 'id' | 'name' | 'partyType'>;

interface PartySelectorProps {
  form: TransactionPayload;
  parties: PartyOption[];
  required?: boolean;
  disabled?: boolean;
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function PartySelector({
  form,
  parties,
  required = false,
  disabled = false,
  onFieldChange,
}: PartySelectorProps) {
  return (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
      <span>Party{required ? <span className='ml-1 text-rose-600'>*</span> : null}</span>
      <select
        required={required}
        disabled={disabled}
        value={inputValue(form.partyId)}
        onChange={event => onFieldChange('partyId', event.target.value || (null as never))}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:cursor-not-allowed disabled:bg-slate-100'
      >
        <option value=''>No party</option>
        {parties.map(party => (
          <option key={party.id} value={party.id}>
            {party.name} ({party.partyType}) · ID {party.id}
          </option>
        ))}
      </select>
    </label>
  );
}
