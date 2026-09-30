import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteAccount, getAccounts } from '../../api/accounts';
import type { Account } from '../../api/types';
import { Button } from '@/components/ui/button';
import { ROUTES } from '../../const/routs';

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['accounts'], queryFn: getAccounts });
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAccountToDelete(null);
      toast.success(response.message || 'Account deleted successfully.');
    },
    onError: mutationError =>
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Unable to delete account.',
      ),
  });
  const accounts = data?.data.items ?? [];
  const filteredAccounts = accounts.filter(account =>
    [
      account.accountCode,
      account.name,
      account.accountType,
      account.bankName ?? '',
      account.accountNumber ?? '',
    ].some(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Accounts</h1>
            <p className='mt-1 text-sm text-slate-500'>Manage bank and cash accounts.</p>
          </div>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search accounts...'
            className='h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm sm:w-64'
          />
          <Button render={<Link to={ROUTES.ADMIN.ACCOUNTS_ADD} />}>
            <Plus /> Add Account
          </Button>
        </div>
        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading accounts...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Failed to load accounts.'}
            </p>
          ) : filteredAccounts.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No accounts found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Code</th>
                    <th className='px-4 py-3'>Account</th>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3'>Bank</th>
                    <th className='px-4 py-3'>Account number</th>
                    <th className='px-4 py-3 text-right'>Opening balance</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr
                      key={account.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='whitespace-nowrap px-4 py-3 font-medium'>
                        {account.accountCode}
                      </td>
                      <td className='px-4 py-3'>{account.name}</td>
                      <td className='px-4 py-3'>{account.accountType}</td>
                      <td className='px-4 py-3'>{account.bankName || '-'}</td>
                      <td className='px-4 py-3'>{account.accountNumber || '-'}</td>
                      <td className='whitespace-nowrap px-4 py-3 text-right'>
                        {Number(account.openingBalance).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${account.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            render={<Link to={ROUTES.ADMIN.ACCOUNTS_EDIT(account.id)} />}
                            aria-label={`Edit ${account.name}`}
                            title='Edit account'
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete ${account.name}`}
                            title='Delete account'
                            onClick={() => setAccountToDelete(account)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {accountToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-account-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-account-title' className='text-lg font-semibold text-slate-900'>
              Delete account?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              Delete {accountToDelete.name}? This action cannot be undone.
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button
                variant='outline'
                disabled={deleteMutation.isPending}
                onClick={() => setAccountToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(accountToDelete.id)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete account'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
