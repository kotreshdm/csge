import type { DashboardSummary } from '../../api/types';

function formatCurrency(value: string) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='min-w-0 border-l-2 border-emerald-700 pl-4'>
      <p className='text-sm text-slate-600'>{label}</p>
      <p className='mt-1 break-words text-xl font-semibold tabular-nums text-slate-950 sm:text-2xl'>
        {value}
      </p>
    </div>
  );
}

export function DashboardSummaryCards({ summary }: { summary: DashboardSummary['summary'] }) {
  const memberShare = Number(summary.memberShare);
  const associateShare = Number(summary.associateShare);
  const totalShare = memberShare + associateShare;
  const totalMemberCount = summary.memberShareCount + summary.associateShareCount;
  const net = Number(summary.totalIncome) - Number(summary.totalExpense);
  return (
    <div className='space-y-8'>
      <section aria-labelledby='share-summary-heading'>
        <h2 id='share-summary-heading' className='mb-4 text-lg font-semibold text-slate-900'>
          Share Summary
        </h2>
        <div className='grid gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
          <Metric label='Member Share' value={formatCurrency(String(memberShare))} />
          <Metric label='Associate Share' value={formatCurrency(String(associateShare))} />
          <Metric label='Total Share' value={formatCurrency(String(totalShare))} />
          <Metric label='Member Count' value={String(summary.memberShareCount)} />
          <Metric label='Associate Count' value={String(summary.associateShareCount)} />
          <Metric label='Total Member Count' value={String(totalMemberCount)} />
        </div>
      </section>

      <section aria-labelledby='site-deposit-heading'>
        <h2 id='site-deposit-heading' className='mb-4 text-lg font-semibold text-slate-900'>
          Total Site Deposit
        </h2>
        <Metric label='Across all layouts' value={formatCurrency(summary.totalSiteDeposit)} />
      </section>

      <section aria-labelledby='income-outgoing-heading'>
        <h2 id='income-outgoing-heading' className='mb-4 text-lg font-semibold text-slate-900'>
          Income / Outgoing
        </h2>
        <div className='grid gap-y-6 sm:grid-cols-2 lg:grid-cols-3'>
          <Metric label='Total Income' value={formatCurrency(summary.totalIncome)} />
          <Metric label='Total Outgoing' value={formatCurrency(summary.totalExpense)} />
          <Metric label='Net' value={formatCurrency(String(net))} />
        </div>
      </section>
    </div>
  );
}
