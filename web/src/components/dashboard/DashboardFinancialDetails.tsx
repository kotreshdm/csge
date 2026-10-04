import type {
  DashboardAmountItem,
  DashboardLayoutDeposit,
  DashboardMemberSummary,
  DashboardSummary,
} from '../../api/types';
import { IncomeExpenseSection } from './IncomeExpenseSection';
import { LayoutDepositSection } from './LayoutDepositSection';
import { MemberPositionSection } from './MemberPositionSection';

interface DashboardFinancialDetailsProps {
  summary: DashboardSummary['summary'];
  incomeBreakdown: DashboardAmountItem[];
  expenseBreakdown: DashboardAmountItem[];
  layoutDeposits: DashboardLayoutDeposit[];
  members: DashboardMemberSummary[];
  financialYear: string;
}

export function DashboardFinancialDetails({
  summary,
  incomeBreakdown,
  expenseBreakdown,
  layoutDeposits,
}: DashboardFinancialDetailsProps) {
  return (
    <div className='space-y-6'>
      <MemberPositionSection summary={summary} incomeBreakdown={incomeBreakdown} />
      <LayoutDepositSection layouts={layoutDeposits} />
      <IncomeExpenseSection income={incomeBreakdown} expense={expenseBreakdown} summary={summary} />
    </div>
  );
}
