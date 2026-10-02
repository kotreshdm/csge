import type { Party, TransactionPayload } from '../../api/types';
import { inputValue } from './transactionRules';

type PartyOption = Pick<Party, 'id' | 'name' | 'partyType'>;

interface PartySelectorProps {
  form: TransactionPayload;
  parties: PartyOption[];
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function PartySelector({ form, parties, onFieldChange }: PartySelectorProps) {
  const filteredParties = parties.filter(party => {
    if (form.type === 'EXPENSE' && form.subType === 'RENT') return party.partyType === 'LANDLORD';
    if (form.type === 'EXPENSE' && form.subType === 'SALARY') return party.partyType === 'EMPLOYEE';
    if (form.type === 'EXPENSE' && form.subType === 'FURNITURE')
      return party.partyType === 'VENDOR';
    if (form.type === 'ADVANCE' && form.subType === 'DIRECTOR_ADVANCE')
      return ['DIRECTOR', 'PRESIDENT'].includes(party.partyType);
    if (form.type === 'ADVANCE' && form.subType === 'DEVELOPER_ADVANCE')
      return party.partyType === 'DEVELOPER';
    if (form.type === 'ASSET' && form.subType === 'BUILDING_ADVANCE')
      return party.partyType === 'BUILDING_OWNER';
    if (form.type === 'ASSET' && form.subType === 'FURNITURE') return party.partyType === 'VENDOR';
    return true;
  });

  return (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
      <span>Party</span>
      <select
        value={inputValue(form.partyId)}
        onChange={event => onFieldChange('partyId', event.target.value || (null as never))}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
      >
        <option value=''>No party</option>
        {filteredParties.map(party => (
          <option key={party.id} value={party.id}>
            {party.name} ({party.partyType}) · ID {party.id}
          </option>
        ))}
      </select>
    </label>
  );
}
