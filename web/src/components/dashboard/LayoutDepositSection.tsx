import { Card, CardContent } from '@/components/ui/card';
import type { DashboardLayoutDeposit } from '../../api/types';
import { formatDashboardCurrency } from './dashboardFormatting';

export function LayoutDepositSection({ layouts }: { layouts: DashboardLayoutDeposit[] }) {
  return (
    <section aria-labelledby='site-deposit-heading'>
      <h2 id='site-deposit-heading' className='mb-3 text-lg font-semibold text-slate-900'>
        Site Deposit by Layout
      </h2>
      <Card>
        <CardContent className='p-0'>
          {layouts.length ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                  <tr>
                    <th className='px-4 py-3'>Layout</th>
                    <th className='px-4 py-3 text-right'>Deposit balance</th>
                    <th className='px-4 py-3 text-right'>Members</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {layouts.map(layout => (
                    <tr key={layout.id}>
                      <td className='px-4 py-3 font-medium text-slate-800'>{layout.label}</td>
                      <td className='px-4 py-3 text-right font-semibold text-amber-700'>
                        {formatDashboardCurrency(layout.amount)}
                      </td>
                      <td className='px-4 py-3 text-right text-slate-600'>{layout.memberCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className='p-4 text-sm text-slate-500'>No layouts are configured.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
