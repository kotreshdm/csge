import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, Search } from 'lucide-react';

import { getLayouts } from '../api/layouts';
import { getMembers } from '../api/members';
import { getSites } from '../api/sites';
import { getTransactions } from '../api/transactions';
import type { Site, Transaction } from '../api/types';
import { DashboardPageHeader } from '../components/dashboard/DashboardPageHeader';

type SortBy = 'date' | 'paid' | 'returned' | 'balance' | 'name';
type AllotmentFilter = 'ALL' | 'ALLOTTED' | 'UNALLOTTED' | 'PAID_UNALLOTTED';
type MemberAmounts = {
  memberId: string;
  memberCode: string;
  name: string;
  memberType: string;
  transactions: Transaction[];
  opening: bigint;
  paid: bigint;
  returned: bigint;
  balance: bigint;
  latestDate: string;
};

const siteSubtypes = new Set(['SITE', 'SITE_DEPOSIT', 'LAYOUT', 'LAYOUT_TRANSFER']);

function subtypeKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function amountCents(value: string | number | null | undefined) {
  const text = String(value ?? '0').trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return 0n;
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

function formatCurrency(cents: bigint) {
  const rupees = Number(cents) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

function siteLiabilityCents(sites: Site[], memberBalance: bigint) {
  const unsettledSitePrice = sites.reduce(
    (total, site) => (site.status === 'SETTLED' ? total : total + amountCents(site.totalPrice)),
    0n,
  );
  const liability = unsettledSitePrice - memberBalance;
  return liability > 0n ? liability : 0n;
}

function memberBalanceAfterSettlements(sites: Site[], transactionBalance: bigint) {
  const settledSitePrice = sites.reduce(
    (total, site) => (site.status === 'SETTLED' ? total + amountCents(site.totalPrice) : total),
    0n,
  );
  const balance = transactionBalance - settledSitePrice;
  return balance > 0n ? balance : 0n;
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
  return {
    start: `${startYear}-04-01`,
    endExclusive: `${startYear + 1}-04-01`,
  };
}

function isLayoutPayment(transaction: Transaction, layoutId: string) {
  return (
    transaction.layoutId === layoutId &&
    Boolean(transaction.memberId) &&
    (transaction.type === 'CREDIT' || transaction.type === 'DEBIT') &&
    (amountCents(transaction.siteDepositAmount) > 0n ||
      siteSubtypes.has(subtypeKey(transaction.subType)))
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

function MemberHistory({
  rows,
  opening,
  paid,
  returned,
  balance,
}: {
  rows: Transaction[];
  opening: bigint;
  paid: bigint;
  returned: bigint;
  balance: bigint;
}) {
  return (
    <div className='space-y-3 bg-slate-50 px-4 py-3'>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Metric label='Opening balance' value={formatCurrency(opening)} tone='border-slate-400' />
        <Metric
          label='Received this period'
          value={formatCurrency(paid)}
          tone='border-emerald-600'
        />
        <Metric
          label='Returned this period'
          value={formatCurrency(returned)}
          tone='border-rose-600'
        />
        <Metric label='Closing balance' value={formatCurrency(balance)} tone='border-sky-700' />
      </div>
      <div className='overflow-x-auto rounded border border-slate-200 bg-white'>
        <table className='w-full min-w-[850px] text-xs'>
          <thead className='bg-slate-100 text-left text-slate-600'>
            <tr>
              <th className='px-3 py-2'>Date</th>
              <th className='px-3 py-2'>Transaction / receipt</th>
              <th className='px-3 py-2'>Subtype</th>
              <th className='px-3 py-2'>Direction</th>
              <th className='px-3 py-2'>Payment / reference</th>
              <th className='px-3 py-2'>Remarks</th>
              <th className='px-3 py-2 text-right'>Amount</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200'>
            {rows.map(transaction => {
              const isTransfer = subtypeKey(transaction.subType) === 'LAYOUT_TRANSFER';
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
                  <td className='px-3 py-2'>{transaction.subType}</td>
                  <td className='px-3 py-2'>
                    <span
                      className={`rounded px-1.5 py-0.5 font-medium ${isTransfer ? 'bg-amber-50 text-amber-800' : isCredit ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}
                    >
                      {isTransfer
                        ? 'Transfer · not applied'
                        : isCredit
                          ? 'IN · Credit'
                          : 'OUT · Debit'}
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
                  <td className='px-3 py-2'>{transaction.remarks || '—'}</td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${isTransfer ? 'text-amber-800' : isCredit ? 'text-emerald-800' : 'text-rose-800'}`}
                  >
                    {formatCurrency(amountCents(transaction.siteDepositAmount))}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className='px-3 py-4 text-center text-slate-500'>
                  No transactions in this financial year. Opening balance is carried forward.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className='text-xs text-amber-800'>
        Layout transfers are shown for review but excluded from the balance because this transaction
        schema has no source/destination layout fields.
      </p>
    </div>
  );
}

export default function LayoutDashboardPage() {
  const [layoutId, setLayoutId] = useState('');
  const [financialYear, setFinancialYear] = useState('ALL');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [search, setSearch] = useState('');
  const [allotmentFilter, setAllotmentFilter] = useState<AllotmentFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const layoutsQuery = useQuery({
    queryKey: ['layout-dashboard-layouts'],
    queryFn: getLayouts,
    staleTime: 60_000,
  });
  const transactionsQuery = useQuery({
    queryKey: ['layout-dashboard-transactions'],
    queryFn: getTransactions,
    staleTime: 30_000,
  });
  const membersQuery = useQuery({
    queryKey: ['layout-dashboard-members'],
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
  const sitesQuery = useQuery({
    queryKey: ['layout-dashboard-sites'],
    queryFn: getSites,
    staleTime: 60_000,
  });
  const activeLayouts = (layoutsQuery.data?.data.items ?? []).filter(
    layout => layout.status.toLowerCase() === 'active',
  );
  const selectedLayoutId = layoutId || activeLayouts[0]?.id || '';
  const allTransactions = transactionsQuery.data?.data.items ?? [];
  const membersById = useMemo(
    () => new Map((membersQuery.data ?? []).map(member => [member.memberId, member])),
    [membersQuery.data],
  );
  const allottedSitesByMember = useMemo(() => {
    const grouped = new Map<string, Site[]>();
    for (const site of sitesQuery.data?.data.items ?? []) {
      if (site.layoutId !== selectedLayoutId || !site.allottedMemberId) continue;
      const assignedSites = grouped.get(site.allottedMemberId) ?? [];
      assignedSites.push(site);
      grouped.set(site.allottedMemberId, assignedSites);
    }
    return grouped;
  }, [sitesQuery.data, selectedLayoutId]);

  const layoutTransactions = useMemo(
    () => allTransactions.filter(transaction => isLayoutPayment(transaction, selectedLayoutId)),
    [allTransactions, selectedLayoutId],
  );
  const financialYears = useMemo(() => {
    const yearSet = new Set(
      layoutTransactions.map(transaction => financialYearFor(transaction.transactionDate)),
    );
    const now = new Date();
    const thisStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    yearSet.add(`${thisStartYear}-${thisStartYear + 1}`);
    return [...yearSet].sort((left, right) => right.localeCompare(left));
  }, [layoutTransactions]);
  const dateBounds = financialYearBounds(financialYear);

  const allMemberAmounts = useMemo(() => {
    const grouped = new Map<string, MemberAmounts>();
    for (const transaction of layoutTransactions) {
      if (!transaction.memberId) continue;
      const member = transaction.member;
      const current = grouped.get(transaction.memberId) ?? {
        memberId: transaction.memberId,
        memberCode: member?.memberCode ?? transaction.memberId,
        name: member?.name ?? 'Unknown member',
        memberType: 'MEMBER',
        transactions: [],
        opening: 0n,
        paid: 0n,
        returned: 0n,
        balance: 0n,
        latestDate: '',
      };
      current.transactions.push(transaction);
      if (transaction.transactionDate > current.latestDate)
        current.latestDate = transaction.transactionDate;
      const isTransfer = subtypeKey(transaction.subType) === 'LAYOUT_TRANSFER';
      if (!isTransfer && transaction.type === 'CREDIT')
        current.paid += amountCents(transaction.siteDepositAmount);
      if (!isTransfer && transaction.type === 'DEBIT')
        current.returned += amountCents(transaction.siteDepositAmount);
      grouped.set(transaction.memberId, current);
    }

    for (const site of sitesQuery.data?.data.items ?? []) {
      if (
        site.layoutId !== selectedLayoutId ||
        !site.allottedMemberId ||
        grouped.has(site.allottedMemberId)
      ) {
        continue;
      }
      const member = membersById.get(site.allottedMemberId) ?? site.allottedMember;
      if (!member) continue;
      grouped.set(site.allottedMemberId, {
        memberId: site.allottedMemberId,
        memberCode: member.memberCode,
        name: member.name,
        memberType: membersById.get(site.allottedMemberId)?.memberType ?? 'MEMBER',
        transactions: [],
        opening: 0n,
        paid: 0n,
        returned: 0n,
        balance: 0n,
        latestDate: '',
      });
    }

    return [...grouped.values()].map(member => {
      const ordered = [...member.transactions].sort(
        (left, right) =>
          left.transactionDate.localeCompare(right.transactionDate) ||
          left.id.localeCompare(right.id),
      );
      let opening = 0n;
      let periodPaid = 0n;
      let periodReturned = 0n;
      for (const transaction of ordered) {
        if (subtypeKey(transaction.subType) === 'LAYOUT_TRANSFER') continue;
        const cents = amountCents(transaction.siteDepositAmount);
        const inPeriod =
          !dateBounds ||
          (transaction.transactionDate >= dateBounds.start &&
            transaction.transactionDate < dateBounds.endExclusive);
        if (!inPeriod && dateBounds && transaction.transactionDate < dateBounds.start) {
          opening += transaction.type === 'CREDIT' ? cents : -cents;
        } else if (inPeriod) {
          if (transaction.type === 'CREDIT') periodPaid += cents;
          else periodReturned += cents;
        }
      }
      const balance = memberBalanceAfterSettlements(
        allottedSitesByMember.get(member.memberId) ?? [],
        opening + periodPaid - periodReturned,
      );
      return {
        ...member,
        memberType: membersById.get(member.memberId)?.memberType ?? member.memberType,
        opening,
        paid: periodPaid,
        returned: periodReturned,
        balance,
      };
    });
  }, [layoutTransactions, dateBounds, membersById, allottedSitesByMember]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const minCents = minimum === '' ? null : amountCents(minimum);
    const maxCents = maximum === '' ? null : amountCents(maximum);
    const rows = allMemberAmounts.filter(member => {
      const matchesQuery =
        !query ||
        member.name.toLocaleLowerCase().includes(query) ||
        member.memberCode.toLocaleLowerCase().includes(query);
      const matchesMinimum = minCents === null || member.balance >= minCents;
      const matchesMaximum = maxCents === null || member.balance <= maxCents;
      const hasAssignedSite = (allottedSitesByMember.get(member.memberId)?.length ?? 0) > 0;
      const hasPaidWithoutSite = !hasAssignedSite && member.paid > 0n;
      const matchesAllotment =
        allotmentFilter === 'ALL' ||
        (allotmentFilter === 'ALLOTTED' && hasAssignedSite) ||
        (allotmentFilter === 'UNALLOTTED' && !hasAssignedSite) ||
        (allotmentFilter === 'PAID_UNALLOTTED' && hasPaidWithoutSite);
      return matchesQuery && matchesMinimum && matchesMaximum && matchesAllotment;
    });
    const direction = sortOrder === 'asc' ? 1 : -1;
    rows.sort((left, right) => {
      const comparison =
        sortBy === 'date'
          ? left.latestDate.localeCompare(right.latestDate)
          : sortBy === 'paid'
            ? left.paid < right.paid
              ? -1
              : left.paid > right.paid
                ? 1
                : 0
            : sortBy === 'returned'
              ? left.returned < right.returned
                ? -1
                : left.returned > right.returned
                  ? 1
                  : 0
              : sortBy === 'balance'
                ? left.balance < right.balance
                  ? -1
                  : left.balance > right.balance
                    ? 1
                    : 0
                : left.name.localeCompare(right.name);
      return comparison === 0
        ? left.memberCode.localeCompare(right.memberCode)
        : comparison * direction;
    });
    return rows;
  }, [allMemberAmounts, search, minimum, maximum, allotmentFilter, sortBy, sortOrder]);

  const layoutTotal = allMemberAmounts.reduce(
    (total, member) => ({
      paid: total.paid + member.paid,
      returned: total.returned + member.returned,
      balance: total.balance + member.balance,
    }),
    { paid: 0n, returned: 0n, balance: 0n },
  );
  const layoutSiteLiability = allMemberAmounts.reduce(
    (total, member) =>
      total + siteLiabilityCents(allottedSitesByMember.get(member.memberId) ?? [], member.balance),
    0n,
  );

  const resetFilters = () => {
    setFinancialYear('ALL');
    setMinimum('');
    setMaximum('');
    setSearch('');
    setAllotmentFilter('ALL');
    setSortBy('date');
    setSortOrder('desc');
    setExpandedMember(null);
  };

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

  const loading =
    layoutsQuery.isLoading ||
    transactionsQuery.isLoading ||
    membersQuery.isLoading ||
    sitesQuery.isLoading;
  const error =
    layoutsQuery.error || transactionsQuery.error || membersQuery.error || sitesQuery.error;

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <DashboardPageHeader title='Layout Dashboard' currentView='layout' />
        {loading ? (
          <p className='py-6 text-sm text-slate-500'>Loading layout transactions...</p>
        ) : error ? (
          <p role='alert' className='py-4 text-sm text-rose-700'>
            Unable to load layouts or transactions.
          </p>
        ) : activeLayouts.length === 0 ? (
          <p className='py-6 text-sm text-slate-500'>No active layouts are available.</p>
        ) : (
          <>
            <section
              aria-label='Selected layout summary'
              className='grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-5'
            >
              {' '}
              <div className='min-w-0 border-l-2 border-slate-500 pl-3'>
                <label
                  htmlFor='layout-dashboard-layout'
                  className='grid min-w-[220px] gap-1 text-xs font-medium text-slate-600'
                >
                  Selected layout
                  <select
                    id='layout-dashboard-layout'
                    value={selectedLayoutId}
                    disabled={activeLayouts.length === 0}
                    onChange={event => {
                      setLayoutId(event.target.value);
                      setExpandedMember(null);
                    }}
                    className='h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900 disabled:bg-slate-100'
                  >
                    {activeLayouts.map(layout => (
                      <option key={layout.id} value={layout.id}>
                        {layout.layoutCode} · {layout.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Metric
                label='Received in period'
                value={formatCurrency(layoutTotal.paid)}
                tone='border-emerald-600'
              />
              <Metric
                label='Returned in period'
                value={formatCurrency(layoutTotal.returned)}
                tone='border-rose-600'
              />
              <Metric
                label='Closing member balance'
                value={formatCurrency(layoutTotal.balance)}
                tone='border-sky-700'
              />
              <Metric
                label='Outstanding site amount'
                value={formatCurrency(layoutSiteLiability)}
                tone='border-amber-600'
              />
            </section>

            <section
              aria-label='Layout payment filters'
              className='grid min-w-0 grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(140px,.8fr)_minmax(180px,1.1fr)_minmax(180px,1.1fr)_minmax(270px,1.6fr)_auto]'
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
              <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                Site allotment
                <select
                  value={allotmentFilter}
                  onChange={event => setAllotmentFilter(event.target.value as AllotmentFilter)}
                  className='h-9 min-w-0 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm font-normal text-slate-900'
                >
                  <option value='ALL'>All members</option>
                  <option value='ALLOTTED'>Site assigned</option>
                  <option value='UNALLOTTED'>No site assigned</option>
                  <option value='PAID_UNALLOTTED'>Paid, no site assigned</option>
                </select>
              </label>
              <div className='grid min-w-0 grid-cols-2 gap-2'>
                <label className='grid min-w-0 gap-1 text-xs font-medium text-slate-600'>
                  Balance from
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={minimum}
                    onChange={event => {
                      const nextMinimum = event.target.value;
                      if (
                        nextMinimum !== '' &&
                        maximum !== '' &&
                        amountCents(nextMinimum) > amountCents(maximum)
                      ) {
                        setMinimum(maximum);
                        return;
                      }
                      setMinimum(nextMinimum);
                    }}
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
                    onChange={event => {
                      const nextMaximum = event.target.value;
                      setMaximum(nextMaximum);
                      if (
                        nextMaximum !== '' &&
                        minimum !== '' &&
                        amountCents(minimum) > amountCents(nextMaximum)
                      ) {
                        setMinimum(nextMaximum);
                      }
                    }}
                    className='h-9 min-w-0 w-full rounded-md border border-slate-300 px-2.5 text-sm font-normal text-slate-900'
                  />
                </label>
              </div>
              <div className='flex items-end'>
                <button
                  type='button'
                  onClick={resetFilters}
                  className='h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50'
                >
                  Reset filters
                </button>
              </div>
            </section>

            <section
              aria-label='Layout member payment ledger'
              className='overflow-x-auto rounded-lg border border-slate-200 bg-white'
            >
              <table className='w-full min-w-[1120px] text-sm'>
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
                    <th className='px-3 py-3 text-left'>Allotted sites</th>
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
                        sortBy === 'paid'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('paid', 'Total paid', 'right')}
                    </th>
                    <th
                      aria-sort={
                        sortBy === 'returned'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='px-3 py-3 text-right'
                    >
                      {sortHeading('returned', 'Total returned', 'right')}
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
                      {sortHeading('balance', 'Balance', 'right')}
                    </th>
                    <th className='px-3 py-3 text-center'>Transactions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-200'>
                  {minimum !== '' &&
                  maximum !== '' &&
                  amountCents(minimum) > amountCents(maximum) ? (
                    <tr>
                      <td colSpan={8} className='px-3 py-8 text-center text-rose-700'>
                        Minimum balance cannot be greater than maximum balance.
                      </td>
                    </tr>
                  ) : visibleMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='px-3 py-8 text-center text-slate-500'>
                        This layout has no matching site-deposit payment records.
                      </td>
                    </tr>
                  ) : (
                    visibleMembers.map(member => {
                      const allottedSites = allottedSitesByMember.get(member.memberId) ?? [];
                      const unsettledSitePrice = allottedSites.reduce(
                        (sum, site) =>
                          site.status === 'SETTLED' ? sum : sum + amountCents(site.totalPrice),
                        0n,
                      );
                      const totalRegisteredAmount = allottedSites.reduce(
                        (sum, site) => sum + amountCents(site.registeredAmount),
                        0n,
                      );
                      const siteLiability = siteLiabilityCents(allottedSites, member.balance);
                      const hasSettledSite = allottedSites.some(site => site.status === 'SETTLED');
                      const settledAtZeroBalance = member.balance === 0n && hasSettledSite;
                      const balanceNeedsAttention = member.balance <= 0n && !settledAtZeroBalance;
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
                              settledAtZeroBalance
                                ? 'bg-emerald-50/80 hover:bg-emerald-100/80'
                                : balanceNeedsAttention
                                  ? 'bg-rose-50/80 hover:bg-rose-100/80'
                                  : 'hover:bg-slate-50'
                            }
                          >
                            <th
                              scope='row'
                              className={`px-3 py-2.5 text-left font-medium text-slate-900 ${settledAtZeroBalance ? 'border-l-2 border-emerald-500' : balanceNeedsAttention ? 'border-l-2 border-rose-500' : ''}`}
                            >
                              <span className='block'>{member.name}</span>
                              <span className='text-xs font-normal text-slate-500'>
                                {member.memberCode}
                              </span>
                              {balanceNeedsAttention && (
                                <span className='sr-only'>Balance is zero or below.</span>
                              )}
                              {settledAtZeroBalance && (
                                <span className='sr-only'>
                                  Site settled; member balance is zero.
                                </span>
                              )}
                            </th>
                            <td className='px-3 py-2.5 text-slate-700'>
                              {member.memberType === 'ASSOCIATE' ? 'Associate' : 'Regular'}
                            </td>
                            <td className='max-w-[360px] px-3 py-2.5'>
                              {allottedSites.length ? (
                                <div className='space-y-1.5'>
                                  {allottedSites.map(site => (
                                    <div
                                      key={site.id}
                                      className='flex flex-wrap items-center gap-x-2 gap-y-0.5'
                                    >
                                      <span className='font-medium text-slate-900'>
                                        Site {site.siteNo}
                                      </span>
                                      <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${site.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-50 text-sky-800'}`}
                                      >
                                        {site.status}
                                      </span>
                                      <span className='text-xs tabular-nums text-slate-600'>
                                        Price {formatCurrency(amountCents(site.totalPrice))}
                                      </span>
                                      {amountCents(site.registeredAmount) > 0n && (
                                        <span className='text-xs tabular-nums text-slate-500'>
                                          Registered{' '}
                                          {formatCurrency(amountCents(site.registeredAmount))}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  <p
                                    className={`text-xs font-medium tabular-nums ${siteLiability === 0n ? 'text-emerald-800' : 'text-rose-800'}`}
                                  >
                                    Site liability {formatCurrency(siteLiability)}
                                    <span className='ml-1 font-normal text-slate-500'>
                                      (unsettled site price {formatCurrency(unsettledSitePrice)}{' '}
                                      less member balance {formatCurrency(member.balance)})
                                    </span>
                                  </p>
                                  {totalRegisteredAmount > 0n && (
                                    <p className='text-xs text-slate-500'>
                                      Registered amount total{' '}
                                      {formatCurrency(totalRegisteredAmount)}
                                    </p>
                                  )}
                                </div>
                              ) : member.paid > 0n ? (
                                <span className='inline-flex rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900'>
                                  Paid, no site assigned
                                </span>
                              ) : (
                                <span className='text-slate-400'>No site assigned</span>
                              )}
                            </td>
                            <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700'>
                              {member.latestDate || '—'}
                            </td>
                            <td className='px-3 py-2.5 text-right font-medium tabular-nums text-emerald-800'>
                              {formatCurrency(member.paid)}
                            </td>
                            <td className='px-3 py-2.5 text-right font-medium tabular-nums text-rose-800'>
                              {formatCurrency(member.returned)}
                            </td>
                            <td
                              className={`px-3 py-2.5 text-right font-semibold tabular-nums ${settledAtZeroBalance ? 'text-emerald-800' : 'text-slate-950'}`}
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
                              <td colSpan={8} className='p-0'>
                                <MemberHistory
                                  rows={inRangeTransactions}
                                  opening={member.opening}
                                  paid={member.paid}
                                  returned={member.returned}
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
