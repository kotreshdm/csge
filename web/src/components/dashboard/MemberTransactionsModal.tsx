import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { getMemberTransactions } from '../../api/dashboard';
import type { MemberTransactionDetailsItem } from '../../api/types';

interface MemberSummary {
  memberId: string;
  memberCode: string;
  name: string;
}

interface MemberTransactionsModalProps {
  member: MemberSummary | null;
  financialYear: string;
  open: boolean;
  onClose: () => void;
}

function formatCurrency(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(parsed);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function transactionMeta(item: MemberTransactionDetailsItem) {
  const parts: string[] = [];

  if (item.type === 'SHARE') {
    if (Number(item.shareAmount || 0) > 0)
      parts.push(`Share Amount: ${formatCurrency(item.shareAmount)}`);
    if (Number(item.shareFeeAmount || 0) > 0)
      parts.push(`Share Fee: ${formatCurrency(item.shareFeeAmount)}`);
    if (Number(item.membershipFeeAmount || 0) > 0)
      parts.push(`Membership Fee: ${formatCurrency(item.membershipFeeAmount)}`);
    if (Number(item.welfareFundAmount || 0) > 0)
      parts.push(`Welfare Fund: ${formatCurrency(item.welfareFundAmount)}`);
    if (Number(item.booksFormsAmount || 0) > 0)
      parts.push(`Books/Forms: ${formatCurrency(item.booksFormsAmount)}`);
    if (Number(item.miscellaneousAmount || 0) > 0)
      parts.push(`Miscellaneous: ${formatCurrency(item.miscellaneousAmount)}`);
    if (Number(item.totalAmount || 0) > 0) parts.push(`Total: ${formatCurrency(item.totalAmount)}`);
  } else if (item.type === 'LAYOUT') {
    if (item.layout?.name) parts.push(`Layout: ${item.layout.name}`);
    if (Number(item.siteDepositAmount || 0) > 0)
      parts.push(`Site Deposit: ${formatCurrency(item.siteDepositAmount)}`);
  } else {
    if (item.type) parts.push(`Type: ${item.type}`);
    if (item.subType) parts.push(`Sub Type: ${item.subType}`);
    if (item.party?.name) parts.push(`Party: ${item.party.name}`);
    if (Number(item.otherAmount || 0) > 0)
      parts.push(`Other Amount: ${formatCurrency(item.otherAmount)}`);
    if (item.description) parts.push(`Description: ${item.description}`);
    if (item.remarks) parts.push(`Remarks: ${item.remarks}`);
  }

  return parts.join(' • ');
}

export function MemberTransactionsModal({
  member,
  financialYear,
  open,
  onClose,
}: MemberTransactionsModalProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [open, financialYear]);

  const query = useQuery({
    queryKey: [
      'member-transactions',
      member?.memberId,
      financialYear,
      page,
      limit,
      sortOrder,
      search,
    ],
    queryFn: () =>
      getMemberTransactions(member!.memberId, {
        financialYear,
        page,
        limit,
        sortOrder,
        search,
      }),
    enabled: open && Boolean(member?.memberId),
    staleTime: 30_000,
    retry: false,
  });

  const report = query.data?.data;
  const transactions = report?.items ?? [];
  const totalPages = report?.totalPages ?? 1;

  const summaryText = useMemo(() => {
    if (!report) {
      return { share: '₹0', siteDeposit: '₹0' };
    }

    return {
      share: formatCurrency(report.balance.share),
      siteDeposit: formatCurrency(report.balance.siteDeposit),
    };
  }, [report]);

  if (!open || !member) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6'>
      <div className='flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl'>
        <div className='flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>
              Member
            </p>
            <h3 className='mt-1 text-xl font-semibold text-slate-900'>
              {member.memberCode} · {member.name}
            </h3>
          </div>
          <Button variant='outline' size='sm' onClick={onClose} className='gap-2'>
            <X className='h-4 w-4' />
            Close
          </Button>
        </div>

        <div className='grid gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 xl:grid-cols-3'>
          <div className='rounded-xl border border-slate-200 bg-white p-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
              Share Balance
            </p>
            <p className='mt-2 text-lg font-bold text-slate-900'>{summaryText.share}</p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
              Site Deposit
            </p>
            <p className='mt-2 text-lg font-bold text-slate-900'>{summaryText.siteDeposit}</p>
          </div>
          <div className='rounded-xl border border-slate-200 bg-white p-3'>
            <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
              Financial Year
            </p>
            <p className='mt-2 text-lg font-bold text-slate-900'>{financialYear}</p>
          </div>
        </div>

        <div className='flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <input
              value={search}
              onChange={event => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder='Search by type, remarks, receipt...'
              className='w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200'
            />
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setSortOrder(current => (current === 'desc' ? 'asc' : 'desc'))}
            >
              Sort: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
          </div>
        </div>

        <div className='overflow-auto'>
          {query.isLoading ? (
            <div className='space-y-3 p-4'>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className='h-12 animate-pulse rounded-lg bg-slate-200' />
              ))}
            </div>
          ) : query.isError ? (
            <div className='p-6 text-sm text-rose-600'>
              Unable to load member transactions. Please try again.
            </div>
          ) : transactions.length === 0 ? (
            <div className='p-6 text-sm text-slate-500'>
              No transactions found for this member in the selected financial year.
            </div>
          ) : (
            <table className='min-w-full table-fixed text-left text-sm'>
              <thead className='bg-slate-50 text-slate-600'>
                <tr>
                  <th className='px-3 py-3'>Date</th>
                  <th className='px-3 py-3'>Type</th>
                  <th className='px-3 py-3'>Sub Type</th>
                  <th className='px-3 py-3'>Direction</th>
                  <th className='px-3 py-3'>Layout</th>
                  <th className='px-3 py-3'>Amount</th>
                  <th className='px-3 py-3'>Payment Mode</th>
                  <th className='px-3 py-3'>Receipt No</th>
                  <th className='px-3 py-3'>Cheque No</th>
                  <th className='px-3 py-3'>Details</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(item => (
                  <tr key={item.id} className='border-t border-slate-200 align-top'>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      {formatDate(item.transactionDate)}
                    </td>
                    <td className='px-3 py-3'>{item.type}</td>
                    <td className='px-3 py-3'>{item.subType || '—'}</td>
                    <td className='px-3 py-3'>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          item.direction === 'IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.direction === 'OUT'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {item.direction}
                      </span>
                    </td>
                    <td className='px-3 py-3'>
                      {item.type === 'LAYOUT'
                        ? item.layout?.name || '—'
                        : '—'}
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap font-medium text-slate-800'>
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className='px-3 py-3'>{item.paymentMode || '—'}</td>
                    <td className='px-3 py-3'>{item.receiptNo || '—'}</td>
                    <td className='px-3 py-3'>{item.chequeNo || '—'}</td>
                    <td className='px-3 py-3 text-slate-600'>{transactionMeta(item) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {report && totalPages > 1 && (
          <div className='flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3'>
            <select
              value={limit}
              onChange={event => {
                setPage(1);
                setLimit(Number(event.target.value));
              }}
              className='rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm'
            >
              {[5, 10, 20].map(option => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className='text-sm text-slate-500'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= totalPages}
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
