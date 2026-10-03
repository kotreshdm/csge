import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardRecentTransaction } from '../../api/types';
import { ROUTES } from '../../const/routs';

function formatCurrency(value: string) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDisplayDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface RecentTransactionsProps {
  transactions: DashboardRecentTransaction[];
  loading?: boolean;
}

export function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between gap-3'>
        <CardTitle>Recent Transactions</CardTitle>
        <Link to={ROUTES.ADMIN.TRANSACTIONS}>
          <Button variant='outline' size='sm' className='gap-1.5'>
            View All
            <ArrowRight className='h-4 w-4' />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-3 p-4'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className='h-12 animate-pulse rounded-lg bg-slate-200' />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className='p-4 text-sm text-slate-500'>No recent transactions found for this financial year.</div>
        ) : (
          <div className='divide-y divide-slate-200'>
            {transactions.map((item) => {
              const isIncoming = item.direction === 'IN';
              const memberLabel = item.member ? `${item.member.memberCode} · ${item.member.name}` : item.party?.name || '—';

              return (
                <div key={item.id} className='flex items-center justify-between gap-3 px-4 py-3'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500'>
                        {item.type}
                      </span>
                      <span className='text-xs text-slate-400'>•</span>
                      <span className='text-xs text-slate-500'>{item.subType}</span>
                    </div>
                    <p className='truncate text-sm font-medium text-slate-800'>{memberLabel}</p>
                    <p className='text-xs text-slate-500'>{formatDisplayDate(item.transactionDate)}</p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <div
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                        isIncoming
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isIncoming ? <TrendingUp className='h-3.5 w-3.5' /> : <TrendingDown className='h-3.5 w-3.5' />}
                      {item.direction}
                    </div>
                    <span className='text-sm font-semibold text-slate-800'>
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
