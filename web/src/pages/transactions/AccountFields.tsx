import type { Account } from '../../api/types';
import type { TransactionPayload } from '../../api/types';
import { inputValue } from './transactionRules';

interface AccountFieldsProps {
  form: TransactionPayload;
  accounts: Account[];
  onFieldChange: <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => void;
}

export function AccountFields({ form, accounts, onFieldChange }: AccountFieldsProps) {
  const accountFields = [
    {
      key: 'fromAccountId' as const,
      label: 'Source account',
      required: form.direction === 'OUT' || form.direction === 'TRANSFER',
    },
    {
      key: 'toAccountId' as const,
      label: 'Destination account',
      required: form.direction === 'IN' || form.direction === 'TRANSFER',
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {accountFields.map(field => (
        <label key={field.key} className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>
            {field.label}
            {field.required ? <span className='ml-1 text-rose-600'>*</span> : null}
          </span>
          <select
            value={inputValue(form[field.key])}
            onChange={event => onFieldChange(field.key, event.target.value as never)}
            required={field.required}
            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
          >
            <option value=''>No account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.accountCode}) · ID {account.id}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
