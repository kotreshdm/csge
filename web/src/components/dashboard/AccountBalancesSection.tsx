import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardBankAccount, DashboardSummary } from '../../api/types';
import { formatDashboardCurrency } from './dashboardFormatting';

export function AccountBalancesSection({
  summary,
  accounts,
}: {
  summary: DashboardSummary['summary'];
  accounts: DashboardBankAccount[];
}) {
  return (
    <section aria-labelledby='funds-heading'>
      <h2 id='funds-heading' className='mb-3 text-lg font-semibold text-slate-900'>
        Bank Accounts & Cash
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='min-w-full text-left text-sm'>
              <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                <tr>
                  <th className='px-4 py-3'>Account</th>
                  <th className='px-4 py-3 text-right'>Balance</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {accounts.length ? (
                  accounts.map(account => (
                    <tr key={account.id}>
                      <td className='px-4 py-3 text-slate-700'>{account.label}</td>
                      <td className='px-4 py-3 text-right font-medium text-sky-700'>
                        {formatDashboardCurrency(account.balance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className='px-4 py-3 text-slate-500'>
                      No active bank accounts.
                    </td>
                  </tr>
                )}
                <tr className='bg-sky-50 font-semibold text-sky-900'>
                  <td className='px-4 py-3'>Bank subtotal</td>
                  <td className='px-4 py-3 text-right'>
                    {formatDashboardCurrency(summary.bankBalance)}
                  </td>
                </tr>
                <tr>
                  <td className='px-4 py-3 text-slate-700'>Cash balance</td>
                  <td className='px-4 py-3 text-right font-medium text-emerald-700'>
                    {formatDashboardCurrency(summary.cashBalance)}
                  </td>
                </tr>
                <tr className='border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900'>
                  <td className='px-4 py-3'>Total available funds</td>
                  <td className='px-4 py-3 text-right'>
                    {formatDashboardCurrency(summary.totalAvailableFunds)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className='px-4 py-3 text-xs text-slate-500'>
            Cash balance is based on the configured CASH account.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
