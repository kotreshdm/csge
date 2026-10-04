import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { deleteTransaction, getTransactions } from '../../api/transactions';
import { Button } from '@/components/ui/button';
import { ROUTES } from '../../const/routs';

export default function TransactionsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
  });
  const transactions = data?.data.items ?? [];
  const filtered = transactions.filter(transaction =>
    [
      String(transaction.cashbookNo ?? ''),
      String(transaction.cashbookPage ?? ''),
      transaction.subType,
      transaction.type,
      transaction.transactionNo,
      transaction.party?.name ?? '',
      transaction.member?.name ?? '',
      transaction.member?.memberCode ?? '',
      transaction.layout?.name ?? '',
      transaction.layout?.layoutCode ?? '',
    ].some(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(response.message || 'Transaction deleted.');
    },
    onError: mutationError =>
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Unable to delete transaction.',
      ),
  });

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Transactions</h1>
            <p className='mt-1 text-sm text-slate-500'>Record and review financial activity.</p>
          </div>
          <label className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-2.5 size-4 text-slate-400' />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search transactions'
              className='h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm'
            />
          </label>
          <Button onClick={() => navigate(ROUTES.ADMIN.TRANSACTIONS_ADD)}>
            <Plus /> Add transaction
          </Button>
        </div>
        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            Showing {filtered.length} of {transactions.length} transactions
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading transactions...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Failed to load transactions.'}
            </p>
          ) : filtered.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No transactions found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Date</th>
                    <th className='px-4 py-3'>Cashbook</th>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3'>Related entity</th>
                    <th className='px-4 py-3 text-right'>Amount</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(transaction => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-slate-100 last:border-0 ${
                        transaction.type === 'CREDIT'
                          ? 'bg-green-50 hover:bg-green-100'
                          : 'bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <td className='whitespace-nowrap px-4 py-3'>
                        {transaction.transactionDate.slice(0, 10)}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='font-medium text-slate-900'>
                          No. {transaction.cashbookNo ?? '—'} · Page{' '}
                          {transaction.cashbookPage ?? '—'}
                        </span>
                        <span className='ml-2 text-slate-500'>{transaction.subType}</span>
                      </td>
                      <td className='px-4 py-3'>{transaction.type}</td>
                      <td className='px-4 py-3'>
                        <div className='space-y-0.5'>
                          {transaction.party ? (
                            <div>
                              <span className='font-medium text-slate-900'>
                                {transaction.party.name}
                              </span>
                              <span className='ml-1 text-xs text-slate-500'>
                                Party · {transaction.party.partyType}
                              </span>
                            </div>
                          ) : null}
                          {transaction.member ? (
                            <div>
                              <span className='font-medium text-slate-900'>
                                {transaction.member.name}
                              </span>
                              <span className='ml-1 text-xs text-slate-500'>
                                Member · {transaction.member.memberCode}
                              </span>
                            </div>
                          ) : null}
                          {transaction.layout ? (
                            <div>
                              <span className='font-medium text-slate-900'>
                                {transaction.layout.name}
                              </span>
                              <span className='ml-1 text-xs text-slate-500'>
                                Layout · {transaction.layout.layoutCode}
                              </span>
                            </div>
                          ) : null}
                          {!transaction.party && !transaction.member && !transaction.layout ? (
                            <span className='text-slate-400'>—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className='whitespace-nowrap px-4 py-3 text-right'>
                        {Number(transaction.totalAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={`Edit cashbook entry ${transaction.cashbookNo ?? ''}`}
                            title='Edit transaction'
                            onClick={() => navigate(ROUTES.ADMIN.TRANSACTIONS_EDIT(transaction.id))}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete cashbook entry ${transaction.cashbookNo ?? ''}`}
                            title='Delete transaction'
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete cashbook entry ${transaction.cashbookNo ?? '(no number)'}?`,
                                )
                              )
                                deleteMutation.mutate(transaction.id);
                            }}
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
    </main>
  );
}
