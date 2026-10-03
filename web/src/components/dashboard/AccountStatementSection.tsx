import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAccountStatements } from '../../api/accounts';
import { getFinancialYears } from '../../api/dashboard';
import type {
  AccountStatementAccount,
  AccountStatementReport,
  AccountStatementTransaction,
} from '../../api/types';
import { formatDashboardCurrency } from './dashboardFormatting';

type PeriodMode = 'financialYear' | 'custom';

function currentFinancialYear() {
  const today = new Date();
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

function financialYearRange(value: string) {
  const startYear = Number(value.slice(0, 4));
  return {
    fromDate: `${startYear}-04-01`,
    toDate: `${startYear + 1}-03-31`,
  };
}

function displayDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function accountKind(type: string) {
  const normalized = type.toUpperCase();
  if (normalized.includes('CASH')) return 'cash';
  if (normalized.includes('BANK')) return 'bank';
  return 'other';
}

function AccountBalanceCard({
  account,
  selected,
  onSelect,
}: {
  account: AccountStatementAccount;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card className={selected ? 'border-sky-500 ring-1 ring-sky-500' : ''}>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-base'>{account.name}</CardTitle>
            <p className='mt-1 text-xs text-slate-500'>
              {account.accountCode} · {account.accountType}
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={onSelect}>
            View Statement
          </Button>
        </div>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-x-4 gap-y-2 text-sm'>
        <Value label='Opening' value={account.openingBalance} />
        <Value label='Credit' value={account.totalCredit} tone='credit' />
        <Value label='Debit' value={account.totalDebit} tone='debit' />
        <Value label='Closing' value={account.closingBalance} strong />
      </CardContent>
    </Card>
  );
}

function Value({
  label,
  value,
  tone,
  strong = false,
}: {
  label: string;
  value: string;
  tone?: 'credit' | 'debit';
  strong?: boolean;
}) {
  const color =
    tone === 'credit' ? 'text-emerald-700' : tone === 'debit' ? 'text-rose-700' : 'text-slate-900';
  return (
    <div className='flex justify-between gap-2'>
      <span className='text-slate-500'>{label}</span>
      <span className={`${color} ${strong ? 'font-bold' : 'font-medium'}`}>
        {formatDashboardCurrency(value)}
      </span>
    </div>
  );
}

export function AccountStatementSection() {
  const defaultYear = currentFinancialYear();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('financialYear');
  const [financialYear, setFinancialYear] = useState(defaultYear);
  const [customFromDate, setCustomFromDate] = useState(financialYearRange(defaultYear).fromDate);
  const [customToDate, setCustomToDate] = useState(financialYearRange(defaultYear).toDate);
  const [accountId, setAccountId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detailTransaction, setDetailTransaction] = useState<AccountStatementTransaction | null>(
    null,
  );

  const yearsQuery = useQuery({
    queryKey: ['dashboard-financial-years'],
    queryFn: getFinancialYears,
    staleTime: 60_000,
  });
  const years = yearsQuery.data?.data.items ?? [defaultYear];
  const period =
    periodMode === 'financialYear'
      ? { financialYear }
      : { fromDate: customFromDate, toDate: customToDate };
  const invalidDateRange = periodMode === 'custom' && customFromDate > customToDate;

  const statementQuery = useQuery({
    queryKey: ['account-statements', periodMode, period, accountId, page, pageSize],
    queryFn: () =>
      getAccountStatements({
        ...period,
        accountId: accountId || undefined,
        page,
        pageSize,
      }),
    enabled: !invalidDateRange,
    staleTime: 30_000,
  });

  const data = statementQuery.data?.data;
  const accounts = data?.accounts ?? [];
  const banks = accounts.filter(account => accountKind(account.accountType) === 'bank');
  const cashAccounts = accounts.filter(account => accountKind(account.accountType) === 'cash');
  const otherAccounts = accounts.filter(account => accountKind(account.accountType) === 'other');
  const selectedStatement = data?.statement;

  useEffect(() => {
    if (!accountId && accounts.length) {
      setAccountId((banks[0] ?? cashAccounts[0] ?? accounts[0]).id);
    }
  }, [accountId, accounts, banks, cashAccounts]);

  const chooseAccount = (nextId: string) => {
    setPage(1);
    setAccountId(nextId);
  };

  const changePeriodMode = (mode: PeriodMode) => {
    setPage(1);
    setPeriodMode(mode);
  };

  return (
    <section aria-labelledby='account-statement-heading' className='space-y-4'>
      <div>
        <h2 id='account-statement-heading' className='text-lg font-semibold text-slate-900'>
          Account Statement
        </h2>
        <p className='mt-1 text-sm text-slate-500'>
          Period balances are calculated through the selected end date.
        </p>
      </div>

      <Card>
        <CardContent className='grid gap-4 p-4 md:grid-cols-3'>
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            Period type
            <select
              value={periodMode}
              onChange={event => changePeriodMode(event.target.value as PeriodMode)}
              className='h-9 rounded-md border border-slate-300 bg-white px-2.5'
            >
              <option value='financialYear'>Financial Year</option>
              <option value='custom'>Custom Date Range</option>
            </select>
          </label>
          {periodMode === 'financialYear' ? (
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              Financial year
              <select
                value={financialYear}
                onChange={event => {
                  setPage(1);
                  setFinancialYear(event.target.value);
                }}
                className='h-9 rounded-md border border-slate-300 bg-white px-2.5'
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    FY {year.slice(0, 4)}-{year.slice(7)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                From date
                <input
                  type='date'
                  value={customFromDate}
                  onChange={event => {
                    setPage(1);
                    setCustomFromDate(event.target.value);
                  }}
                  className='h-9 rounded-md border border-slate-300 bg-white px-2.5'
                />
              </label>
              <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                To date
                <input
                  type='date'
                  value={customToDate}
                  min={customFromDate}
                  onChange={event => {
                    setPage(1);
                    setCustomToDate(event.target.value);
                  }}
                  className='h-9 rounded-md border border-slate-300 bg-white px-2.5'
                />
              </label>
            </>
          )}
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            Selected account
            <select
              value={accountId}
              onChange={event => chooseAccount(event.target.value)}
              className='h-9 rounded-md border border-slate-300 bg-white px-2.5'
            >
              <option value=''>All account balances</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.accountCode}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {invalidDateRange && (
        <p role='alert' className='text-sm text-rose-700'>
          From date cannot be after To date.
        </p>
      )}
      {statementQuery.isLoading ? (
        <p className='text-sm text-slate-500'>Calculating account balances...</p>
      ) : null}
      {statementQuery.isError ? (
        <p role='alert' className='text-sm text-rose-700'>
          Unable to load account statements.
        </p>
      ) : null}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Overall Bank Summary</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <Metric label='Opening balance' value={data.bankTotals.openingBalance} />
              <Metric label='Total credit' value={data.bankTotals.totalCredit} tone='credit' />
              <Metric label='Total debit' value={data.bankTotals.totalDebit} tone='debit' />
              <Metric label='Closing balance' value={data.bankTotals.closingBalance} strong />
            </CardContent>
          </Card>

          <AccountGroup
            title='Bank Accounts'
            accounts={banks}
            selectedId={accountId}
            onSelect={chooseAccount}
          />
          <AccountGroup
            title='Cash Account'
            accounts={cashAccounts}
            selectedId={accountId}
            onSelect={chooseAccount}
          />
          {otherAccounts.length ? (
            <AccountGroup
              title='Other Accounts'
              accounts={otherAccounts}
              selectedId={accountId}
              onSelect={chooseAccount}
            />
          ) : null}
        </>
      )}

      {selectedStatement && (
        <SelectedStatement
          statement={selectedStatement}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={value => {
            setPage(1);
            setPageSize(value);
          }}
          onViewDetails={setDetailTransaction}
        />
      )}

      {detailTransaction && (
        <TransactionDetails
          transaction={detailTransaction}
          onClose={() => setDetailTransaction(null)}
        />
      )}
    </section>
  );
}

function AccountGroup({
  title,
  accounts,
  selectedId,
  onSelect,
}: {
  title: string;
  accounts: AccountStatementAccount[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <h3 className='mb-3 text-base font-semibold text-slate-800'>{title}</h3>
      {accounts.length ? (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {accounts.map(account => (
            <AccountBalanceCard
              key={account.id}
              account={account}
              selected={selectedId === account.id}
              onSelect={() => onSelect(account.id)}
            />
          ))}
        </div>
      ) : (
        <p className='text-sm text-slate-500'>No active {title.toLowerCase()}.</p>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
  strong = false,
}: {
  label: string;
  value: string;
  tone?: 'credit' | 'debit';
  strong?: boolean;
}) {
  const color =
    tone === 'credit' ? 'text-emerald-700' : tone === 'debit' ? 'text-rose-700' : 'text-slate-900';
  return (
    <div className='rounded-md border border-slate-200 bg-white p-3'>
      <p className='text-xs font-semibold uppercase text-slate-500'>{label}</p>
      <p className={`mt-2 text-lg ${strong ? 'font-bold' : 'font-semibold'} ${color}`}>
        {formatDashboardCurrency(value)}
      </p>
    </div>
  );
}

function SelectedStatement({
  statement,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
}: {
  statement: NonNullable<AccountStatementReport['statement']>;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetails: (transaction: AccountStatementTransaction) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>{statement.account.name} Statement</CardTitle>
            <p className='mt-1 text-sm text-slate-500'>
              {displayDate(statement.period.fromDate)} – {displayDate(statement.period.toDate)}
            </p>
          </div>
          <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs'>
            <span>
              Opening <strong>{formatDashboardCurrency(statement.openingBalance)}</strong>
            </span>
            <span className='text-emerald-700'>
              Credit <strong>{formatDashboardCurrency(statement.totalCredit)}</strong>
            </span>
            <span className='text-rose-700'>
              Debit <strong>{formatDashboardCurrency(statement.totalDebit)}</strong>
            </span>
            <span>
              Closing <strong>{formatDashboardCurrency(statement.closingBalance)}</strong>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {statement.transactions.length ? (
          <div className='overflow-x-auto'>
            <table className='min-w-full text-left text-sm'>
              <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                <tr>
                  <th className='px-3 py-3'>Date</th>
                  <th className='px-3 py-3'>Cashbook</th>
                  <th className='px-3 py-3'>Type / Subtype</th>
                  <th className='px-3 py-3'>Description</th>
                  <th className='px-3 py-3 text-right'>Credit</th>
                  <th className='px-3 py-3 text-right'>Debit</th>
                  <th className='px-3 py-3 text-right'>Balance</th>
                  <th className='px-3 py-3'>Details</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {statement.transactions.map(item => (
                  <tr key={item.id}>
                    <td className='whitespace-nowrap px-3 py-3'>
                      {displayDate(item.transactionDate)}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 text-slate-500'>
                      {item.cashbookNo ?? '—'} / {item.cashbookPage ?? '—'}
                    </td>
                    <td className='px-3 py-3'>
                      <span className='font-medium'>{item.type}</span>
                      <span className='block text-xs text-slate-500'>{item.subType || '—'}</span>
                    </td>
                    <td className='max-w-56 truncate px-3 py-3 text-slate-600'>
                      {item.description ||
                        item.party?.name ||
                        item.member?.name ||
                        item.remarks ||
                        '—'}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 text-right text-emerald-700'>
                      {Number(item.credit) ? formatDashboardCurrency(item.credit) : '—'}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 text-right text-rose-700'>
                      {Number(item.debit) ? formatDashboardCurrency(item.debit) : '—'}
                    </td>
                    <td className='whitespace-nowrap px-3 py-3 text-right font-semibold'>
                      {formatDashboardCurrency(item.runningBalance)}
                    </td>
                    <td className='px-3 py-3'>
                      <Button
                        variant='outline'
                        size='sm'
                        aria-label={`View details for transaction ${item.id}`}
                        onClick={() => onViewDetails(item)}
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='p-5 text-sm text-slate-500'>
            No transactions for this account in the selected period.
          </p>
        )}
        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3'>
          <label className='flex items-center gap-2 text-xs text-slate-500'>
            Rows
            <select
              value={pageSize}
              onChange={event => onPageSizeChange(Number(event.target.value))}
              className='rounded border border-slate-300 bg-white px-2 py-1'
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>{statement.total} transactions</span>
          </label>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={statement.page <= 1}
              onClick={() => onPageChange(statement.page - 1)}
            >
              Previous
            </Button>
            <span className='text-xs text-slate-500'>
              Page {statement.page} of {statement.totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={statement.page >= statement.totalPages}
              onClick={() => onPageChange(statement.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDetails({
  transaction,
  onClose,
}: {
  transaction: AccountStatementTransaction;
  onClose: () => void;
}) {
  const fields = [
    ['Direction', transaction.direction],
    [
      'Member',
      transaction.member ? `${transaction.member.memberCode} · ${transaction.member.name}` : '—',
    ],
    ['Party', transaction.party?.name ?? '—'],
    ['Layout', transaction.layout?.name ?? '—'],
    ['From layout', transaction.fromLayout?.name ?? '—'],
    ['To layout', transaction.toLayout?.name ?? '—'],
    ['From account', transaction.fromAccount?.name ?? '—'],
    ['To account', transaction.toAccount?.name ?? '—'],
    ['Payment mode', transaction.paymentMode ?? '—'],
    ['Receipt number', transaction.receiptNo ?? '—'],
    ['Cheque number', transaction.chequeNo ?? '—'],
    ['Bank reference', transaction.bankReferenceNo ?? '—'],
    ['Amount', formatDashboardCurrency(transaction.totalAmount)],
    ['Remarks', transaction.remarks ?? '—'],
  ];
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4'
      role='presentation'
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='statement-transaction-title'
        className='max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl'
      >
        <header className='flex items-start justify-between border-b border-slate-200 p-4'>
          <div>
            <p className='text-xs text-slate-500'>Transaction {transaction.id}</p>
            <h3 id='statement-transaction-title' className='mt-1 text-lg font-semibold'>
              {transaction.type} · {transaction.subType || 'No subtype'}
            </h3>
          </div>
          <Button
            variant='outline'
            size='sm'
            aria-label='Close transaction details'
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </header>
        <dl className='grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2'>
          <Detail label='Date' value={displayDate(transaction.transactionDate)} />
          <Detail
            label='Cashbook'
            value={`${transaction.cashbookNo ?? '—'} / ${transaction.cashbookPage ?? '—'}`}
          />
          {fields.map(([label, value]) => (
            <Detail key={label} label={label} value={value} />
          ))}
          <div className='sm:col-span-2'>
            <Detail label='Description' value={transaction.description ?? '—'} />
          </div>
        </dl>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-xs font-medium uppercase text-slate-500'>{label}</dt>
      <dd className='mt-1 break-words text-sm text-slate-800'>{value}</dd>
    </div>
  );
}
