import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardAmountItem, DashboardSummary } from '../../api/types';
import { formatDashboardCurrency } from './dashboardFormatting';

export function MemberPositionSection({
  summary,
  incomeBreakdown,
}: {
  summary: DashboardSummary['summary'];
  incomeBreakdown: DashboardAmountItem[];
}) {
  const shareChargeLabels = [
    'Share fee',
    'Membership fee',
    'Welfare fund',
    'Books/forms charges',
    'Other charges',
  ];
  const shareCharges = incomeBreakdown.filter(item => shareChargeLabels.includes(item.label));

  return (
    <>
      <section aria-labelledby='member-position-heading'>
        <h2 id='member-position-heading' className='mb-3 text-lg font-semibold text-slate-900'>
          Member Financial Position
        </h2>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <Metric
            label='Total Share'
            value={formatDashboardCurrency(summary.totalMemberShare)}
            tone='violet'
          />
          <Metric label='Share Members' value={String(summary.shareMemberCount)} tone='violet' />
          <Metric
            label='Total Site Deposit'
            value={formatDashboardCurrency(summary.totalSiteDeposit)}
            tone='amber'
          />
          <Metric
            label='Site Deposit Members'
            value={String(summary.siteDepositMemberCount)}
            tone='amber'
          />
        </div>
        <div className='mt-3 flex flex-wrap items-center justify-between gap-3 border-l-4 border-amber-500 bg-amber-50 px-4 py-3'>
          <span className='text-sm font-semibold text-slate-800'>
            Member liabilities: share + site deposits
          </span>
          <span className='text-lg font-bold text-slate-900'>
            {formatDashboardCurrency(summary.totalLiability)}
          </span>
        </div>
      </section>

      <section aria-labelledby='share-breakdown-heading'>
        <h2 id='share-breakdown-heading' className='mb-3 text-lg font-semibold text-slate-900'>
          Share Breakdown
        </h2>
        <div className='grid gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Share balances by member type</CardTitle>
            </CardHeader>
            <CardContent className='divide-y divide-slate-100'>
              <AmountRow
                label='Regular members'
                amount={summary.memberShare}
                count={summary.memberShareCount}
              />
              <AmountRow
                label='Associate members'
                amount={summary.associateShare}
                count={summary.associateShareCount}
              />
              <AmountRow label='Total share liability' amount={summary.totalMemberShare} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Share charges received this year</CardTitle>
            </CardHeader>
            <CardContent className='divide-y divide-slate-100'>
              {shareCharges.length ? (
                shareCharges.map(item => (
                  <div key={item.label} className='flex justify-between gap-3 py-2.5 text-sm'>
                    <span className='text-slate-700'>{item.label}</span>
                    <span className='font-semibold text-emerald-700'>
                      {formatDashboardCurrency(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className='py-3 text-sm text-slate-500'>No share charges recorded this year.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'violet' | 'amber';
}) {
  const style =
    tone === 'violet'
      ? 'border-violet-200 bg-violet-50 text-violet-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
  return (
    <div className={`rounded-md border p-3 ${style}`}>
      <p className='text-xs font-semibold uppercase'>{label}</p>
      <p className='mt-2 text-xl font-bold'>{value}</p>
    </div>
  );
}

function AmountRow({ label, amount, count }: { label: string; amount: string; count?: number }) {
  return (
    <div className='flex items-center justify-between gap-3 py-2.5 text-sm'>
      <span className='text-slate-700'>
        {label}
        {count === undefined ? '' : ` · ${count} members`}
      </span>
      <span className='whitespace-nowrap font-semibold text-slate-900'>
        {formatDashboardCurrency(amount)}
      </span>
    </div>
  );
}
