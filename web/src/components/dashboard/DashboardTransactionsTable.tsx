import { Button } from '@/components/ui/button';
import type { DashboardTransactionsPage } from '../../api/types';

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface DashboardTransactionsTableProps {
  financialYear: string;
  transactions?: DashboardTransactionsPage;
  loading: boolean;
  error: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function DashboardTransactionsTable({
  financialYear,
  transactions,
  loading,
  error,
  page,
  onPageChange,
}: DashboardTransactionsTableProps) {
  return (
    <section aria-labelledby='financial-year-transactions-heading'>
      <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2
            id='financial-year-transactions-heading'
            className='text-lg font-semibold text-slate-900'
          >
            Financial Year Transactions
          </h2>
          <p className='mt-1 text-sm text-slate-500'>FY {financialYear}</p>
        </div>
        {transactions && !loading && !error && (
          <p className='text-sm text-slate-500'>
            {transactions.total} {transactions.total === 1 ? 'transaction' : 'transactions'}
          </p>
        )}
      </div>

      <div className='overflow-hidden rounded-md border border-slate-200 bg-white'>
        {error ? (
          <p role='alert' className='p-5 text-sm text-rose-700'>
            Unable to load transactions.
          </p>
        ) : loading ? (
          <p className='p-5 text-sm text-slate-500'>Loading transactions...</p>
        ) : !transactions?.items.length ? (
          <p className='p-5 text-sm text-slate-500'>No transactions for this financial year.</p>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[720px] border-collapse text-left text-sm'>
              <thead className='bg-slate-100 text-xs font-semibold uppercase text-slate-600'>
                <tr>
                  <th className='px-4 py-3'>Date</th>
                  <th className='px-4 py-3'>Type</th>
                  <th className='px-4 py-3'>Description</th>
                  <th className='px-4 py-3'>Member / Party</th>
                  <th className='px-4 py-3'>Direction</th>
                  <th className='px-4 py-3 text-right'>Amount</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {transactions.items.map(item => {
                  const person = item.member
                    ? `${item.member.memberCode} · ${item.member.name}`
                    : (item.party?.name ?? '—');
                  return (
                    <tr key={item.id} className='text-slate-700'>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {formatDate(item.transactionDate)}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        <span className='font-medium text-slate-900'>{item.type}</span>
                        {item.subType && (
                          <span className='block text-xs text-slate-500'>{item.subType}</span>
                        )}
                      </td>
                      <td
                        className='max-w-xs truncate px-4 py-3'
                        title={item.description || item.remarks || ''}
                      >
                        {item.description || item.remarks || '—'}
                      </td>
                      <td className='max-w-xs truncate px-4 py-3'>{person}</td>
                      <td className='whitespace-nowrap px-4 py-3'>{item.direction}</td>
                      <td className='whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900'>
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && transactions && transactions.totalPages > 1 && (
          <div className='flex items-center justify-between border-t border-slate-200 px-4 py-3'>
            <p className='text-sm text-slate-500'>
              Page {transactions.page} of {transactions.totalPages}
            </p>
            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={page >= transactions.totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
