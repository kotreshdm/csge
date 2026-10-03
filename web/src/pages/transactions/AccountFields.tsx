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
  return (
    <div>
      <p className='mb-3 text-xs text-slate-500'>
        {form.type === 'BANK' && form.direction === 'IN'
          ? 'Deposit: choose the bank account that receives the amount.'
          : form.type === 'BANK' && form.direction === 'OUT'
            ? 'Withdrawal: choose the bank account that pays the amount.'
            : 'Choose the account linked to this transaction.'}
      </p>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
          <span>
            Account
            <span className='ml-1 text-rose-600'>*</span>
          </span>
          <select
            value={inputValue(form.accountId)}
            onChange={event => onFieldChange('accountId', event.target.value || (null as never))}
            required
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
      </div>
    </div>
  );
}
