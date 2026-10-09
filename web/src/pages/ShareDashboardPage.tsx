import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, Search } from 'lucide-react';

import { getMembers } from '../api/members';
import { getTransactions } from '../api/transactions';
import type { Transaction } from '../api/types';
import { DashboardPageHeader } from '../components/dashboard/DashboardPageHeader';

type SortBy = 'date' | 'in' | 'out' | 'balance' | 'name';
type ShareMemberAmounts = {
  memberId: string;
  memberCode: string;
  name: string;
  memberType: string;
  transactions: Transaction[];
  opening: bigint;
  received: bigint;
  withdrawn: bigint;
  balance: bigint;
  latestDate: string;
};

function subtypeKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function amountCents(value: string | number | null | undefined) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value ?? '0').trim());
  if (!match) return 0n;
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

function formatCurrency(cents: bigint) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(cents) / 100);
}

function financialYearFor(date: string) {
  const [yearText, monthText] = date.split('-');
  const year = Number(yearText);
  const startYear = Number(monthText) >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function financialYearBounds(value: string) {
  if (!value || value === 'ALL') return null;
  const startYear = Number(value.slice(0, 4));
  return { start: `${startYear}-04-01`, endExclusive: `${startYear + 1}-04-01` };
}

function isShareTransaction(transaction: Transaction) {
  return (
    Boolean(transaction.memberId) &&
    (transaction.type === 'CREDIT' || transaction.type === 'DEBIT') &&
    ['SHARE', 'SHARE_WITHDRAWAL'].includes(subtypeKey(transaction.subType)) &&
    amountCents(transaction.shareAmount) > 0n
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`min-w-0 border-l-2 pl-3 ${tone}`}>
      <p className='text-xs font-medium text-slate-600'>{label}</p>
      <p className='mt-1 truncate text-lg font-semibold tabular-nums text-slate-950'>{value}</p>
    </div>
  );
}

function ShareHistory({
  rows,
  opening,
  received,
  withdrawn,
  balance,
}: {
  rows: Transaction[];
  opening: bigint;
  received: bigint;
  withdrawn: bigint;
  balance: bigint;
}) {
  return (
    <div className='space-y-3 bg-slate-50 px-4 py-3'>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Metric label='Opening balance' value={formatCurrency(opening)} tone='border-slate-400' />
        <Metric label='Shares issued' value={formatCurrency(received)} tone='border-emerald-600' />
        <Metric label='Shares withdrawn' value={formatCurrency(withdrawn)} tone='border-rose-600' />
        <Metric label='Closing balance' value={formatCurrency(balance)} tone='border-sky-700' />
      </div>
      <div className='overflow-x-auto rounded border border-slate-200 bg-white'>
        <table className='w-full min-w-[900px] text-xs'>
          <thead className='bg-slate-100 text-left text-slate-600'>
            <tr>
              <th className='px-3 py-2'>Date</th>
              <th className='px-3 py-2'>Transaction / receipt</th>
              <th className='px-3 py-2'>Subtype</th>
              <th className='px-3 py-2'>Direction</th>
              <th className='px-3 py-2'>Payment / reference</th>
              <th className='px-3 py-2 text-right'>Share amount</th>
              <th className='px-3 py-2 text-right'>Share fee</th>
              <th className='px-3 py-2'>Remarks</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200'>
            {rows.map(transaction => {
              const isCredit = transaction.type === 'CREDIT';
              return (
                <tr key={transaction.id}>
                  <td className='whitespace-nowrap px-3 py-2'>{transaction.transactionDate}</td>
                  <td className='px-3 py-2'>
                    <span className='font-medium text-slate-900'>{transaction.transactionNo}</span>
                    {transaction.receiptNo && (
                      <span className='ml-1 text-slate-500'>/ {transaction.receiptNo}</span>
                    )}
                  </td>
                  <td className='px-3 py-2'>{transaction.subType.replaceAll('_', ' ')}</td>
                  <td className='px-3 py-2'>
                    <span
                      className={`rounded px-1.5 py-0.5 font-medium ${isCredit ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}
                    >
                      {isCredit ? 'IN · Credit' : 'OUT · Debit'}
                    </span>
                  </td>
                  <td className='px-3 py-2'>
                    {[
                      transaction.paymentMode?.replaceAll('_', ' '),
                      transaction.chequeNo,
                      transaction.bankReferenceNo,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${isCredit ? 'text-emerald-800' : 'text-rose-800'}`}
                  >
                    {formatCurrency(amountCents(transaction.shareAmount))}
                  </td>
                  <td className='whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-700'>
                    {formatCurrency(amountCents(transaction.shareFeeAmount))}
                  </td>
                  <td className='px-3 py-2'>{transaction.remarks || '—'}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className='px-3 py-4 text-center text-slate-500'>
                  No share transactions in this financial year. Opening balance is carried forward.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ShareDashboardPage() {
  const [financialYear, setFinancialYear] = useState('ALL');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const transactionsQuery = useQuery({
    queryKey: ['share-dashboard-transactions'],
    queryFn: getTransactions,
    staleTime: 30_000,
  });
  const membersQuery = useQuery({
    queryKey: ['share-dashboard-members'],
    queryFn: async () => {
      const firstPage = await getMembers({ page: 1, limit: 100 });
      const members = [...firstPage.data.items];
      for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
        const response = await getMembers({ page, limit: 100 });
        members.push(...response.data.items);
      }
      return members;
    },
    staleTime: 60_000,
  });

  const shareTransactions = useMemo(
    () => (transactionsQuery.data?.data.items ?? []).filter(isShareTransaction),
    [transactionsQuery.data],
  );
  const financialYears = useMemo(() => {
    const years = new Set(
      shareTransactions.map(transaction => financialYearFor(transaction.transactionDate)),
    );
    const now = new Date();
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    years.add(`${startYear}-${startYear + 1}`);
    return [...years].sort((left, right) => right.localeCompare(left));
  }, [shareTransactions]);
  const dateBounds = financialYearBounds(financialYear);
  const membersById = useMemo(
    () => new Map((membersQuery.data ?? []).map(member => [member.memberId, member])),
    [membersQuery.data],
  );

  const allMemberAmounts = useMemo(() => {
    const grouped = new Map<string, ShareMemberAmounts>();
    for (const transaction of shareTransactions) {
      if (!transaction.memberId) continue;
      const member = transaction.member;
      const current = grouped.get(transaction.memberId) ?? {
        memberId: transaction.memberId,
        memberCode: member?.memberCode ?? transaction.memberId,
        name: member?.name ?? 'Unknown member',
        memberType: 'MEMBER',
        transactions: [],
        opening: 0n,
        received: 0n,
        withdrawn: 0n,
        balance: 0n,
        latestDate: '',
      };
      current.transactions.push(transaction);
      if (transaction.transactionDate > current.latestDate)
        current.latestDate = transaction.transactionDate;
      grouped.set(transaction.memberId, current);
    }

    return [...grouped.values()].map(member => {
      const ordered = [...member.transactions].sort(
        (left, right) =>
          left.transactionDate.localeCompare(right.transactionDate) ||
          left.id.localeCompare(right.id),
      );
      let opening = 0n;
      let periodReceived = 0n;
      let periodWithdrawn = 0n;
      for (const transaction of ordered) {
        const amount = amountCents(transaction.shareAmount);
        const inPeriod =
          !dateBounds ||
          (transaction.transactionDate >= dateBounds.start &&
            transaction.transactionDate < dateBounds.endExclusive);
        if (!inPeriod && dateBounds && transaction.transactionDate < dateBounds.start) {
          opening += transaction.type === 'CREDIT' ? amount : -amount;
        } else if (inPeriod) {
          if (transaction.type === 'CREDIT') periodReceived += amount;
          else periodWithdrawn += amount;
        }
      }
      return {
        ...member,
        memberType: membersById.get(member.memberId)?.memberType ?? 'MEMBER',
        opening,
        received: periodReceived,
        withdrawn: periodWithdrawn,
        balance: opening + periodReceived - periodWithdrawn,
      };
    });
  }, [shareTransactions, dateBounds, membersById]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const minCents = minimum === '' ? null : amountCents(minimum);
    const maxCents = maximum === '' ? null : amountCents(maximum);
    const rows = allMemberAmounts.filter(member => {
      const matchesQuery =
        !query ||
        member.name.toLocaleLowerCase().includes(query) ||
        member.memberCode.toLocaleLowerCase().includes(query);
      return (
        matchesQuery &&
        (minCents === null || member.balance >= minCents) &&
        (maxCents === null || member.balance <= maxCents)
      );
    });
    const direction = sortOrder === 'asc' ? 1 : -1;
    rows.sort((left, right) => {
      const comparison =
        sortBy === 'date'
          ? left.latestDate.localeCompare(right.latestDate)
          : sortBy === 'in'
            ? left.received < right.received
              ? -1
              : left.received > right.received
                ? 1
                : 0
            : sortBy === 'out'
              ? left.withdrawn < right.withdrawn
                ? -1
                : left.withdrawn > right.withdrawn
                  ? 1
                  : 0
              : sortBy === 'balance'
                ? left.balance < right.balance
                  ? -1
                  : left.balance > right.balance
                    ? 1
                    : 0
                : left.name.localeCompare(right.name);
      return (comparison || left.memberCode.localeCompare(right.memberCode)) * direction;
    });
    return rows;
  }, [allMemberAmounts, search, minimum, maximum, sortBy, sortOrder]);

  const totals = allMemberAmounts.reduce(
    (total, member) => ({
      received: total.received + member.received,
      withdrawn: total.withdrawn + member.withdrawn,
      balance: total.balance + member.balance,
    }),
    { received: 0n, withdrawn: 0n, balance: 0n },
  );

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setSortOrder(field === 'date' ? 'desc' : 'asc');
  };

  const sortHeading = (field: SortBy, label: string, align: 'left' | 'right' = 'left') => {
    const active = sortBy === field;
    const Indicator = active ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <button
        type='button'
        onClick={() => handleSort(field)}
        aria-label={`Sort by ${label}${active ? `, ${sortOrder === 'asc' ? 'ascending' : 'descending'}` : ''}`}
        title={`Sort by ${label}`}
        className={`inline-flex items-center gap-1.5 font-semibold ${align === 'right' ? 'ml-auto' : ''} ${active ? 'text-emerald-900' : 'text-slate-600 hover:text-slate-950'}`}
      >
        {label}
        <Indicator aria-hidden='true' className='size-3.5 shrink-0' />
      </button>
    );
  };

  const loading = transactionsQuery.isLoading || membersQuery.isLoading;
  const error = transactionsQuery.error || membersQuery.error;

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <DashboardPageHeader title='Share Transaction Dashboard' currentView='share' />
        {loading ? (
          <p className='py-6 text-sm text-slate-500'>Loading share transactions...</p>
        ) : error ? (
          <p role='alert' className='py-4 text-sm text-rose-700'>
            Unable to load members or share transactions.
          </p>
        ) : (
          <>
            <section
              aria-label='Share transaction summary'
              className='grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-3'
            >
              <Metric
                label='Shares issued in period'
                value={formatCurrency(totals.received)}
                tone='border-emerald-600'
              />
              <Metric
                label='Shares withdrawn in period'
                value={formatCurrency(totals.withdrawn)}
                tone='border-rose-600'
              />
              <Metric
                label='Closing share balance'
                value={formatCurrency(totals.balance)}
                tone='border-sky-700'
              />
            </section>

            <section
              aria-label='Share transaction filters'
              className='grid min-w-0 grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(150px,.8fr)_minmax(240px,1.4fr)_minmax(260px,1.4fr)_auto]'
            >
              <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                Financial year
                <select
                  value={financialYear}
                  onChange={event => setFinancialYear(event.target.value)}
                  className='h-9 min-w-0 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900'
                >
                  <option value='ALL'>All financial years</option>
                  {financialYears.map(year => (
                    <option key={year} value={year}>
                      {year.slice(0, 4)}–{year.slice(5)}
                    </option>
                  ))}
                </select>
              </label>
              <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                Search member
                <span className='relative'>
                  <Search
                    aria-hidden='true'
                    className='absolute left-2.5 top-2.5 size-4 text-slate-400'
                  />
                  <input
                    type='search'
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder='Name or member code'
                    className='h-9 w-full rounded-md border border-slate-300 pl-8 pr-2.5 text-sm font-normal text-slate-900'
                  />
                </span>
              </label>
              <div className='grid min-w-0 grid-cols-2 gap-2'>
                <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                  Balance from
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={minimum}
                    onChange={event => setMinimum(event.target.value)}
                    className='h-9 min-w-0 w-full rounded-md border border-slate-300 px-2.5 text-sm font-normal text-slate-900'
                  />
                </label>
                <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                  Balance to
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={maximum}
                    onChange={event => setMaximum(event.target.value)}
                    className='h-9 min-w-0 w-full rounded-md border border-slate-300 px-2.5 text-sm font-normal text-slate-900'
                  />
                </label>
              </div>
              <button
                type='button'
                onClick={() => {
                  setFinancialYear('ALL');
                  setMinimum('');
                  setMaximum('');
                  setSearch('');
                  setSortBy('date');
                  setSortOrder('desc');
                  setExpandedMember(null);
                }}
                className='h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50'
              >
                Reset filters
              </button>
            </section>

            <section
              aria-label='Share member ledger'
              className='overflow-x-auto rounded-lg border border-slate-200 bg-white'
            >
              <table className='w-full min-w-[900px] text-sm'>
                <thead className='bg-slate-100 text-xs font-semibold text-slate-600'>
                  <tr>
                    <th
                      aria-sort={
                        sortBy === 'name'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-left'
                    >
                      {sortHeading('name', 'Member')}
                    </th>
                    <th className='px-3 py-3 text-left'>Member type</th>
                    <th
                      aria-sort={
                        sortBy === 'date'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('date', 'Latest transaction', 'right')}
                    </th>
                    <th
                      aria-sort={
                        sortBy === 'in'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('in', 'Shares issued', 'right')}
                    </th>
                    <th
                      aria-sort={
                        sortBy === 'out'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('out', 'Shares withdrawn', 'right')}
                    </th>
                    <th
                      aria-sort={
                        sortBy === 'balance'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('balance', 'Share balance', 'right')}
                    </th>
                    <th className='px-3 py-3 text-center'>Transactions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {minimum !== '' &&
                  maximum !== '' &&
                  amountCents(minimum) > amountCents(maximum) ? (
                    <tr>
                      <td colSpan={7} className='px-3 py-8 text-center text-rose-700'>
                        Minimum balance cannot be greater than maximum balance.
                      </td>
                    </tr>
                  ) : visibleMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='px-3 py-8 text-center text-slate-500'>
                        No matching share transaction records.
                      </td>
                    </tr>
                  ) : (
                    visibleMembers.map(member => {
                      const inRangeTransactions = member.transactions.filter(
                        transaction =>
                          !dateBounds ||
                          (transaction.transactionDate >= dateBounds.start &&
                            transaction.transactionDate < dateBounds.endExclusive),
                      );
                      return (
                        <Fragment key={member.memberId}>
                          <tr
                            className={
                              member.balance === 0n
                                ? 'bg-rose-100 hover:bg-rose-100'
                                : member.balance < 0n
                                  ? 'bg-rose-300 hover:bg-rose-300'
                                  : 'hover:bg-slate-50'
                            }
                          >
                            <th
                              scope='row'
                              className='px-3 py-2.5 text-left font-medium text-slate-900'
                            >
                              <span className='block'>{member.name}</span>
                              <span className='text-xs font-normal text-slate-500'>
                                {member.memberCode}
                              </span>
                            </th>
                            <td className='px-3 py-2.5 text-slate-700'>
                              {member.memberType === 'ASSOCIATE' ? 'Associate' : 'Regular'}
                            </td>
                            <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700'>
                              {member.latestDate || '—'}
                            </td>
                            <td className='px-3 py-2.5 text-right font-medium tabular-nums text-emerald-800'>
                              {formatCurrency(member.received)}
                            </td>
                            <td className='px-3 py-2.5 text-right font-medium tabular-nums text-rose-800'>
                              {formatCurrency(member.withdrawn)}
                            </td>
                            <td
                              className={`px-3 py-2.5 text-right font-semibold tabular-nums ${member.balance <= 0n ? 'text-rose-700' : 'text-slate-950'}`}
                            >
                              {formatCurrency(member.balance)}
                            </td>
                            <td className='px-3 py-2.5 text-center'>
                              <button
                                type='button'
                                onClick={() =>
                                  setExpandedMember(current =>
                                    current === member.memberId ? null : member.memberId,
                                  )
                                }
                                aria-expanded={expandedMember === member.memberId}
                                aria-label={`${expandedMember === member.memberId ? 'Hide' : 'Show'} ${member.name} transactions`}
                                className='inline-flex size-8 items-center justify-center rounded border border-slate-300 text-slate-700 hover:bg-slate-100'
                              >
                                {expandedMember === member.memberId ? (
                                  <ChevronUp aria-hidden='true' className='size-4' />
                                ) : (
                                  <ChevronDown aria-hidden='true' className='size-4' />
                                )}
                              </button>
                            </td>
                          </tr>
                          {expandedMember === member.memberId && (
                            <tr>
                              <td colSpan={7} className='p-0'>
                                <ShareHistory
                                  rows={inRangeTransactions}
                                  opening={member.opening}
                                  received={member.received}
                                  withdrawn={member.withdrawn}
                                  balance={member.balance}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
