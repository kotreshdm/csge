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

function SummaryMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='min-w-0 border-l-2 border-emerald-700 pl-3'>
      <p className='text-sm text-slate-600'>{label}</p>
      <p className='mt-1 break-words text-xl font-semibold tabular-nums text-slate-950'>{value}</p>
    </div>
  );
}

function MemberCountCard({
  title,
  active,
  inactive,
  total,
}: {
  title: string;
  active: number;
  inactive: number;
  total: number;
}) {
  return (
    <div className='min-w-0 border-l-2 border-emerald-700 pl-3'>
      <p className='text-sm font-medium text-slate-700'>{title}</p>
      <div className='mt-2 flex whitespace-nowrap items-center gap-3 text-sm'>
        <span className='font-semibold text-emerald-700'>
          <strong className='text-emerald-800'>{active}</strong>
        </span>
        <span aria-hidden='true' className='text-slate-300'>
          +
        </span>
        <span className='font-semibold text-rose-600'>
          <strong className='text-rose-700'>{inactive}</strong>
        </span>
        <span aria-hidden='true' className='text-slate-300'>
          =
        </span>
        <span className='font-bold text-slate-950'> {total}</span>
      </div>
    </div>
  );
}

function ShareSummary({ share }: { share: DashboardPositions['share'] }) {
  return (
    <section aria-labelledby='share-summary-heading' className='border-slate-200 pt-3'>
      <div className='mb-5 flex items-center gap-2'>
        <UsersRound aria-hidden='true' className='size-5 text-emerald-800' />
        <h2 id='share-summary-heading' className='text-lg font-semibold text-slate-900'>
          Share Summary
        </h2>
      </div>
      <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        <SummaryMetric label='Member Share Amount' value={formatCurrency(share.memberAmount)} />
        <SummaryMetric
          label='Associate Share Amount'
          value={formatCurrency(share.associateAmount)}
        />
        <SummaryMetric label='Total Share Amount' value={formatCurrency(share.totalAmount)} />
      </div>
      <div className='mt-5 grid gap-4 sm:grid-cols-3'>
        <MemberCountCard
          title='Regular Members'
          active={share.regularActiveMemberCount}
          inactive={share.regularInactiveMemberCount}
          total={share.regularMemberCount}
        />
        <MemberCountCard
          title='Associate Members'
          active={share.associateActiveMemberCount}
          inactive={share.associateInactiveMemberCount}
          total={share.associateMemberCount}
        />
        <MemberCountCard
          title='Total Members'
          active={share.regularActiveMemberCount + share.associateActiveMemberCount}
          inactive={share.regularInactiveMemberCount + share.associateInactiveMemberCount}
          total={share.totalMemberCount}
        />
      </div>
    </section>
  );
}

function SiteDepositSummary({ siteDeposit }: { siteDeposit: DashboardPositions['siteDeposit'] }) {
  return (
    <section aria-labelledby='site-deposit-heading' className='border-t border-slate-200 pt-5'>
      <div className='mb-5 flex items-center gap-2'>
        <WalletCards aria-hidden='true' className='size-5 text-sky-800' />
        <h2 id='site-deposit-heading' className='text-lg font-semibold text-slate-900'>
          Site Deposit Summary
        </h2>
      </div>
      <div className='grid gap-6 lg:grid-cols-[minmax(220px,1fr)_2fr]'>
        <SummaryMetric
          label='Total Site Deposit Amount'
          value={formatCurrency(siteDeposit.totalAmount)}
        />
        <div>
          <h3 className='mb-2 text-sm font-medium text-slate-700'>
            Layout-wise Site Deposit Amount
          </h3>
          {siteDeposit.layouts.length === 0 ? (
            <p className='py-2 text-sm text-slate-500'>No layout site deposits recorded.</p>
          ) : (
            <ul className='divide-y divide-slate-200 border-y border-slate-200'>
              {siteDeposit.layouts.map(layout => (
                <li
                  key={layout.id}
                  className='flex flex-wrap items-center justify-between gap-2 py-3'
                >
                  <span className='flex min-w-0 items-center gap-2 text-sm text-slate-800'>
                    <MapPin aria-hidden='true' className='size-4 shrink-0 text-slate-500' />
                    <span className='truncate'>
                      {layout.layoutCode ? `${layout.layoutCode} · ` : ''}
                      {layout.name}
                    </span>
                  </span>
                  <span className='whitespace-nowrap text-sm font-semibold tabular-nums text-slate-950'>
                    {formatCurrency(layout.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
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
