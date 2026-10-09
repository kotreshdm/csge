import { useQuery } from '@tanstack/react-query';
import { MapPin, UsersRound, WalletCards } from 'lucide-react';

import { getDashboardPositions } from '../api/dashboard';
import type { DashboardPositions } from '../api/types';

function formatCurrency(value: string) {
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ShareSummary({ share }: { share: DashboardPositions['share'] }) {
  const totalActive = share.regularActiveMemberCount + share.associateActiveMemberCount;
  const totalInactive = share.regularInactiveMemberCount + share.associateInactiveMemberCount;
  const amountCell = 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums';

  return (
    <section aria-labelledby='share-summary-heading' className='pt-3'>
      <div className='mb-3 flex items-center gap-2'>
        <UsersRound aria-hidden='true' className='size-5 text-emerald-800' />
        <h2 id='share-summary-heading' className='text-lg font-semibold text-slate-900'>
          Share Summary
        </h2>
        <span className='ml-auto text-sm font-semibold tabular-nums text-emerald-900'>
          Balance {formatCurrency(share.totalAmount)}
        </span>
      </div>

      <div className='overflow-x-auto rounded-lg border border-slate-200 bg-white'>
        <table className='w-full min-w-[760px] text-sm'>
          <caption className='sr-only'>Member counts and share balance, inflow, and outflow by type</caption>
          <thead className='bg-slate-100 text-left text-xs font-semibold text-slate-600'>
              <tr>
                <th scope='col' className='px-4 py-3'>
                  Member Type
                </th>
                <th scope='col' className='px-4 py-3 text-right'>
                  <span className='inline-flex items-center gap-1.5'>
                    <span aria-hidden='true' className='size-2 rounded-full bg-emerald-600' />
                    Active
                  </span>
                </th>
                <th scope='col' className='px-4 py-3 text-right'>
                  <span className='inline-flex items-center gap-1.5'>
                    <span aria-hidden='true' className='size-2 rounded-full bg-rose-600' />
                    Inactive
                  </span>
                </th>
                <th scope='col' className='px-4 py-3 text-right'>
                  Total
                </th>
                <th scope='col' className='px-3 py-3 text-right'>
                  Share Balance
                </th>
                <th scope='col' className='px-3 py-3 text-right text-emerald-800'>
                  Share In
                </th>
                <th scope='col' className='px-3 py-3 text-right text-rose-800'>
                  Share Out
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200 text-slate-700'>
              <tr>
                <th scope='row' className='px-4 py-3 text-left font-medium text-slate-800'>
                  Regular Members
                </th>
                <td className='px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-800'>
                  {share.regularActiveMemberCount}
                </td>
                <td className='px-4 py-2.5 text-right font-semibold tabular-nums text-rose-800'>
                  {share.regularInactiveMemberCount}
                </td>
                <td className='px-4 py-2.5 text-right font-bold tabular-nums text-slate-950'>
                  {share.regularMemberCount}
                </td>
                <td className={`${amountCell} font-semibold text-slate-950`}>
                  {formatCurrency(share.memberAmount)}
                </td>
                <td className={`${amountCell} font-semibold text-emerald-800`}>
                  {formatCurrency(share.regularShareInAmount)}
                </td>
                <td className={`${amountCell} font-semibold text-rose-800`}>
                  {formatCurrency(share.regularShareOutAmount)}
                </td>
              </tr>
              <tr>
                <th scope='row' className='px-4 py-3 text-left font-medium text-slate-800'>
                  Associate Members
                </th>
                <td className='px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-800'>
                  {share.associateActiveMemberCount}
                </td>
                <td className='px-4 py-2.5 text-right font-semibold tabular-nums text-rose-800'>
                  {share.associateInactiveMemberCount}
                </td>
                <td className='px-4 py-2.5 text-right font-bold tabular-nums text-slate-950'>
                  {share.associateMemberCount}
                </td>
                <td className={`${amountCell} font-semibold text-slate-950`}>
                  {formatCurrency(share.associateAmount)}
                </td>
                <td className={`${amountCell} font-semibold text-emerald-800`}>
                  {formatCurrency(share.associateShareInAmount)}
                </td>
                <td className={`${amountCell} font-semibold text-rose-800`}>
                  {formatCurrency(share.associateShareOutAmount)}
                </td>
              </tr>
              <tr className='bg-emerald-50/70'>
                <th scope='row' className='px-4 py-2.5 text-left font-semibold text-slate-950'>
                  Total Members
                </th>
                <td className='px-4 py-2.5 text-right font-bold tabular-nums text-emerald-900'>
                  {totalActive}
                </td>
                <td className='px-4 py-2.5 text-right font-bold tabular-nums text-rose-900'>
                  {totalInactive}
                </td>
                <td className='px-4 py-2.5 text-right font-bold tabular-nums text-slate-950'>
                  {share.totalMemberCount}
                </td>
                <td className={`${amountCell} font-bold text-slate-950`}>
                  {formatCurrency(share.totalAmount)}
                </td>
                <td className={`${amountCell} font-bold text-emerald-900`}>
                  {formatCurrency(share.totalInAmount)}
                </td>
                <td className={`${amountCell} font-bold text-rose-900`}>
                  {formatCurrency(share.totalOutAmount)}
                </td>
              </tr>
            </tbody>
        </table>
      </div>
    </section>
  );
}

function SiteDepositSummary({ siteDeposit }: { siteDeposit: DashboardPositions['siteDeposit'] }) {
  return (
    <section aria-labelledby='site-deposit-heading' className='border-t border-slate-200 pt-5'>
      <div className='mb-3 flex items-center gap-2'>
        <WalletCards aria-hidden='true' className='size-5 text-sky-800' />
        <h2 id='site-deposit-heading' className='text-lg font-semibold text-slate-900'>
          Site Deposit Summary
        </h2>
        <span className='ml-auto text-sm font-semibold tabular-nums text-sky-900'>
          Total {formatCurrency(siteDeposit.totalAmount)}
        </span>
      </div>
      <div className='overflow-x-auto rounded-lg border border-slate-200 bg-white'>
        <table className='w-full min-w-[760px] text-sm'>
          <caption className='sr-only'>Site deposit incoming, outgoing, unique members, and balance by layout</caption>
          <thead className='bg-slate-100 text-left text-xs font-semibold text-slate-600'>
            <tr>
              <th scope='col' className='px-4 py-3'>Layout</th>
              <th scope='col' className='px-3 py-3 text-right text-emerald-800'>Total In</th>
              <th scope='col' className='px-3 py-3 text-right text-rose-800'>Total Out</th>
              <th scope='col' className='px-3 py-3 text-right'>Unique Members</th>
              <th scope='col' className='px-4 py-3 text-right'>Site Deposit Amount</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-200 text-slate-700'>
            {siteDeposit.layouts.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-6 text-center text-slate-500'>
                  No layout site deposits recorded.
                </td>
              </tr>
            ) : (
              siteDeposit.layouts.map(layout => (
                <tr key={layout.id} className='hover:bg-slate-50'>
                  <th scope='row' className='px-4 py-2.5 text-left font-medium text-slate-800'>
                    <span className='inline-flex min-w-0 items-center gap-2'>
                      <MapPin aria-hidden='true' className='size-4 shrink-0 text-slate-400' />
                      <span className='truncate'>
                        {layout.layoutCode ? `${layout.layoutCode} · ` : ''}
                        {layout.name}
                      </span>
                    </span>
                  </th>
                  <td className='whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-emerald-800'>
                    {formatCurrency(layout.totalInAmount)}
                  </td>
                  <td className='whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-rose-800'>
                    {formatCurrency(layout.totalOutAmount)}
                  </td>
                  <td className='whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-800'>
                    {layout.uniqueMemberCount.toLocaleString('en-IN')}
                  </td>
                  <td className='whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-slate-950'>
                    {formatCurrency(layout.amount)}
                  </td>
                </tr>
              ))
            )}
            <tr className='bg-sky-50/70'>
              <th scope='row' className='px-4 py-2.5 text-left font-semibold text-slate-950'>
                Total Site Deposit
              </th>
              <td className='whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums text-emerald-900'>
                {formatCurrency(siteDeposit.totalInAmount)}
              </td>
              <td className='whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums text-rose-900'>
                {formatCurrency(siteDeposit.totalOutAmount)}
              </td>
              <td className='whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums text-slate-950'>
                {siteDeposit.uniqueMemberCount.toLocaleString('en-IN')}
              </td>
              <td className='whitespace-nowrap px-4 py-2.5 text-right font-bold tabular-nums text-sky-900'>
                {formatCurrency(siteDeposit.totalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const positionsQuery = useQuery({
    queryKey: ['dashboard-positions'],
    queryFn: getDashboardPositions,
    staleTime: 60_000,
  });

  return (
    <main className='min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-7xl space-y-7'>
        <header className='border-b border-slate-200 pb-4'>
          <p className='text-sm font-medium text-emerald-800'>Cooperative</p>
          <h1 className='mt-1 text-2xl font-semibold text-slate-950'>Dashboard</h1>
        </header>

        {positionsQuery.isLoading ? (
          <p className='py-6 text-sm text-slate-500'>Loading dashboard summaries...</p>
        ) : positionsQuery.isError || !positionsQuery.data ? (
          <p role='alert' className='py-4 text-sm text-rose-700'>
            Unable to load dashboard summaries.
          </p>
        ) : (
          <div className='space-y-8'>
            <ShareSummary share={positionsQuery.data.data.share} />
            <SiteDepositSummary siteDeposit={positionsQuery.data.data.siteDeposit} />
          </div>
        )}
      </div>
    </main>
  );
}
