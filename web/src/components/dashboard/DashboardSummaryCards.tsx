import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'accent';
  icon: LucideIcon;
}

function formatCurrency(value: string) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function SummaryCard({ title, value, subtitle, tone = 'neutral', icon: Icon }: SummaryCardProps) {
  const toneStyles = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-900',
    positive: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    negative: 'border-rose-200 bg-rose-50 text-rose-900',
    accent: 'border-cyan-200 bg-cyan-50 text-cyan-900',
  };

  return (
    <Card className={toneStyles[tone]}>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
              {title}
            </p>
            <p className='mt-3 text-2xl font-bold tracking-tight'>{value}</p>
          </div>
          <div className='rounded-xl border border-current/10 bg-white/70 p-2.5 text-current'>
            <Icon className='h-5 w-5' />
          </div>
        </div>
        <p className='mt-3 text-xs text-slate-500'>{subtitle}</p>
      </CardContent>
    </Card>
  );
}

interface DashboardSummaryCardsProps {
  totalIncome: string;
  totalExpense: string;
  profitLoss: string;
  totalLiability: string;
  totalMemberShare: string;
  totalSiteDeposit: string;
  financialYear: string;
}

export function DashboardSummaryCards({
  totalIncome,
  totalExpense,
  profitLoss,
  totalLiability,
  totalMemberShare,
  totalSiteDeposit,
  financialYear,
}: DashboardSummaryCardsProps) {
  const cards: SummaryCardProps[] = [
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome),
      subtitle: `${financialYear} income`,
      tone: 'positive',
      icon: Wallet,
    },
    {
      title: 'Total Expense',
      value: formatCurrency(totalExpense),
      subtitle: `${financialYear} expense`,
      tone: 'negative',
      icon: ArrowDownRight,
    },
    {
      title: profitLoss >= '0' ? 'Profit' : 'Loss',
      value: formatCurrency(profitLoss),
      subtitle: `${financialYear} net result`,
      tone: profitLoss >= '0' ? 'positive' : 'negative',
      icon: profitLoss >= '0' ? TrendingUp : ArrowUpRight,
    },
    {
      title: 'Total Liability',
      value: formatCurrency(totalLiability),
      subtitle: `Share + site deposit`,
      tone: 'accent',
      icon: Landmark,
    },
    {
      title: 'Member Share',
      value: formatCurrency(totalMemberShare),
      subtitle: 'Open member share balance',
      tone: 'neutral',
      icon: PiggyBank,
    },
    {
      title: 'Site Deposit',
      value: formatCurrency(totalSiteDeposit),
      subtitle: 'Site deposit liability',
      tone: 'neutral',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}
