import type {
  DashboardAmountItem,
  DashboardBankAccount,
  DashboardLayoutDeposit,
  DashboardMemberSummary,
  DashboardSummary,
} from '../../api/types';
import { AccountBalancesSection } from './AccountBalancesSection';
import { AccountStatementSection } from './AccountStatementSection';
import { IncomeExpenseSection } from './IncomeExpenseSection';
import { LayoutDepositSection } from './LayoutDepositSection';
import { MemberPositionSection } from './MemberPositionSection';

interface DashboardFinancialDetailsProps {
  summary: DashboardSummary['summary'];
  incomeBreakdown: DashboardAmountItem[];
  expenseBreakdown: DashboardAmountItem[];
  layoutDeposits: DashboardLayoutDeposit[];
  bankAccounts: DashboardBankAccount[];
  members: DashboardMemberSummary[];
  financialYear: string;
}

export function DashboardFinancialDetails({
  summary,
  incomeBreakdown,
  expenseBreakdown,
  layoutDeposits,
  bankAccounts,
}: DashboardFinancialDetailsProps) {
  return (
    <div className='space-y-6'>
      <MemberPositionSection summary={summary} incomeBreakdown={incomeBreakdown} />
      <LayoutDepositSection layouts={layoutDeposits} />
      <AccountBalancesSection summary={summary} accounts={bankAccounts} />
      <AccountStatementSection />
      <IncomeExpenseSection income={incomeBreakdown} expense={expenseBreakdown} summary={summary} />
    </div>
  );
}
