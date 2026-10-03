import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';

import { getAccounts } from '../../api/accounts';
import { getLayouts } from '../../api/layouts';
import { getMembers } from '../../api/members';
import { getParties } from '../../api/parties';
import {
  createTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from '../../api/transactions';
import type { TransactionPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import { ROUTES } from '../../const/routs';
import type { RootState } from '../../store';

import { AccountFields } from './AccountFields';
import { AdvanceTransactionFields } from './AdvanceTransactionFields';
import { AssetTransactionFields } from './AssetTransactionFields';
import { BankTransactionFields } from './BankTransactionFields';
import { CashbookReference } from './CashbookReference';
import { CommonTransactionFields } from './CommonTransactionFields';
import { ExpenseTransactionFields } from './ExpenseTransactionFields';
import { IncomeTransactionFields } from './IncomeTransactionFields';
import { LayoutSelector } from './LayoutSelector';
import { LayoutTransactionFields } from './LayoutTransactionFields';
import { MemberSelector } from './MemberSelector';
import { OtherTransactionFields } from './OtherTransactionFields';
import { PartySelector } from './PartySelector';
import { PaymentFields } from './PaymentFields';
import { ShareTransactionFields } from './ShareTransactionFields';
import {
  blankTransaction,
  buildTransactionPayload,
  getFilteredParties,
  isLayoutVisible,
  isMemberVisible,
  isPartyVisible,
  normalizeTransaction,
} from './transactionRules';
import { validateTransaction } from './transactionValidation';

async function getAllMembers() {
  const firstPage = await getMembers({ page: 1, limit: 100 });
  const members = [...firstPage.data.items];

  for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
    const response = await getMembers({ page, limit: 100 });
    members.push(...response.data.items);
  }

  return members;
}

function FormSectionHeading({
  title,
  color,
}: {
  title: string;
  color: 'teal' | 'blue' | 'amber' | 'emerald' | 'rose';
}) {
  const colors = {
    teal: 'bg-teal-700',
    blue: 'bg-sky-700',
    amber: 'bg-amber-600',
    emerald: 'bg-emerald-700',
    rose: 'bg-rose-700',
  };

  return (
    <div className='mb-3 flex items-center gap-2 border-b border-slate-200 pb-2'>
      <span aria-hidden='true' className={`h-4 w-1 rounded-sm ${colors[color]}`} />
      <h2 className='text-sm font-semibold text-slate-800'>{title}</h2>
    </div>
  );
}

interface TransactionFormPageProps {
  mode: 'create' | 'edit';
}

export default function TransactionFormPage({ mode }: TransactionFormPageProps) {
  const isEditing = mode === 'edit';
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const [memberLookup, setMemberLookup] = useState('');
  const [isMemberOptionsOpen, setIsMemberOptionsOpen] = useState(false);
  const [form, setForm] = useState<TransactionPayload>(() =>
    blankTransaction(user?.memberId ?? ''),
  );
  const hasSelectedTransactionDate = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: transactionData,
    isLoading: transactionLoading,
    error: transactionError,
  } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => getTransaction(id),
    enabled: isEditing && Boolean(id),
  });

  const { data: transactionListData } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    enabled: !isEditing,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['transaction-member-options'],
    queryFn: getAllMembers,
    staleTime: 60_000,
  });

  const { data: partiesData } = useQuery({
    queryKey: ['transaction-party-options'],
    queryFn: getParties,
    staleTime: 60_000,
  });

  const { data: layoutsData } = useQuery({
    queryKey: ['transaction-layout-options'],
    queryFn: getLayouts,
    staleTime: 60_000,
  });

  const { data: accountsData } = useQuery({
    queryKey: ['transaction-account-options'],
    queryFn: getAccounts,
    staleTime: 60_000,
  });

  const members = membersData ?? [];
  const parties = partiesData?.data.items ?? [];
  const layouts = layoutsData?.data.items ?? [];
  const accounts = accountsData?.data.items ?? [];
  const transaction = transactionData?.data;
  const filteredParties = useMemo(() => getFilteredParties(parties, form), [parties, form]);
  const selectedMember = useMemo(
    () => members.find(member => member.memberId === form.memberId),
    [members, form.memberId],
  );

  const lastShareInTransaction = useMemo(() => {
    const transactions = transactionListData?.data.items ?? [];
    return (
      [...transactions]
        .filter(transaction => transaction.type === 'SHARE' && transaction.direction === 'IN')
        .sort((left, right) => Number(BigInt(right.id)) - Number(BigInt(left.id)))
        .at(0) ?? null
    );
  }, [transactionListData]);

  useEffect(() => {
    if (!transaction) {
      return;
    }

    setForm(normalizeTransaction({ ...transaction, updatedBy: user?.memberId ?? null }));
  }, [transaction, user?.memberId]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const transactions = transactionListData?.data.items ?? [];
    if (transactions.length === 0) {
      return;
    }

    const lastTransaction = transactions.reduce((latest, candidate) =>
      BigInt(candidate.id) > BigInt(latest.id) ? candidate : latest,
    );

    setForm(previous =>
      normalizeTransaction({
        ...previous,
        cashbookNo:
          previous.cashbookNo === '' ? (lastTransaction.cashbookNo ?? '') : previous.cashbookNo,
        cashbookPage:
          previous.cashbookPage === ''
            ? (lastTransaction.cashbookPage ?? '')
            : previous.cashbookPage,
        transactionDate: hasSelectedTransactionDate.current
          ? previous.transactionDate
          : lastTransaction.transactionDate.slice(0, 10),
        chequeDate:
          previous.chequeDate ?? lastTransaction.transactionDate?.slice(0, 10) ?? null,
      }),
    );
  }, [isEditing, transactionListData]);

  useEffect(() => {
    if (isEditing || form.direction !== 'IN' || form.type !== 'SHARE' || !selectedMember) {
      return;
    }

    setForm(previous =>
      normalizeTransaction({
        ...previous,
        receiptNo: selectedMember.recieptNo ?? '',
      }),
    );
  }, [form.direction, form.type, isEditing, selectedMember]);

  useEffect(() => {
    if (isEditing || form.type !== 'SHARE' || form.direction !== 'IN' || !lastShareInTransaction) {
      return;
    }

    setForm(previous => {
      if (previous.type !== 'SHARE' || previous.direction !== 'IN') {
        return previous;
      }

      const defaults = {
        receiptNo: previous.receiptNo || lastShareInTransaction.receiptNo || '',
        toAccountId: previous.toAccountId ?? lastShareInTransaction.toAccountId ?? null,
        paymentMode: previous.paymentMode ?? lastShareInTransaction.paymentMode ?? null,
        shareAmount:
          previous.shareAmount === '0' ? lastShareInTransaction.shareAmount : previous.shareAmount,
        shareFeeAmount:
          previous.shareFeeAmount === '0'
            ? lastShareInTransaction.shareFeeAmount
            : previous.shareFeeAmount,
        membershipFeeAmount:
          previous.membershipFeeAmount === '0'
            ? lastShareInTransaction.membershipFeeAmount
            : previous.membershipFeeAmount,
        welfareFundAmount:
          previous.welfareFundAmount === '0'
            ? lastShareInTransaction.welfareFundAmount
            : previous.welfareFundAmount,
        booksFormsAmount:
          previous.booksFormsAmount === '0'
            ? lastShareInTransaction.booksFormsAmount
            : previous.booksFormsAmount,
        miscellaneousAmount:
          previous.miscellaneousAmount === '0'
            ? lastShareInTransaction.miscellaneousAmount
            : previous.miscellaneousAmount,
      };

      return normalizeTransaction({ ...previous, ...defaults });
    });
  }, [form.direction, form.type, isEditing, lastShareInTransaction]);

  const updateField = <K extends keyof TransactionPayload>(
    field: K,
    value: TransactionPayload[K],
  ) => {
    if (field === 'transactionDate') {
      hasSelectedTransactionDate.current = true;
    }
    setForm(previous => normalizeTransaction({ ...previous, [field]: value }));
  };

  const handleTypeChange = (value: TransactionPayload['type']) => {
    setForm(previous => normalizeTransaction({ ...previous, type: value }));
  };

  const handleDirectionChange = (value: TransactionPayload['direction']) => {
    setForm(previous => normalizeTransaction({ ...previous, direction: value }));
  };

  const selectMember = (memberId: string) => {
    const member = members.find(candidate => candidate.memberId === memberId);
    setForm(previous =>
      normalizeTransaction({
        ...previous,
        memberId: memberId || null,
        ...(member && !isEditing && previous.direction === 'IN' && previous.type === 'SHARE'
          ? {
              receiptNo: member.recieptNo ?? '',
            }
          : {}),
      }),
    );
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateTransaction(form);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    const actorMemberId = user?.memberId;
    if (!actorMemberId) {
      toast.error('Your signed-in account could not be identified. Please sign in again.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildTransactionPayload(form, actorMemberId, isEditing);
      const response = isEditing
        ? await updateTransaction(id, payload)
        : await createTransaction(payload);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(response.message || `Transaction ${isEditing ? 'updated' : 'created'}.`);
      navigate(ROUTES.ADMIN.TRANSACTIONS);
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : 'Unable to save transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (form.type) {
      case 'SHARE':
        return <ShareTransactionFields form={form} onFieldChange={updateField} />;
      case 'LAYOUT':
        return (
          <LayoutTransactionFields form={form} layouts={layouts} onFieldChange={updateField} />
        );
      case 'BANK':
        return <BankTransactionFields form={form} onFieldChange={updateField} />;
      case 'EXPENSE':
        return <ExpenseTransactionFields form={form} onFieldChange={updateField} />;
      case 'INCOME':
        return <IncomeTransactionFields form={form} onFieldChange={updateField} />;
      case 'ADVANCE':
        return <AdvanceTransactionFields form={form} onFieldChange={updateField} />;
      case 'ASSET':
        return <AssetTransactionFields form={form} onFieldChange={updateField} />;
      case 'OTHER':
        return <OtherTransactionFields form={form} onFieldChange={updateField} />;
      default:
        return null;
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <header className='mb-6 flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>
              {isEditing ? 'Edit transaction' : 'Add transaction'}
            </h1>
            <p className='mt-1 text-sm text-slate-500'>
              Member identifies the account affected. Entry attribution is recorded from your
              signed-in account. New entries start with the last cashbook number and page; adjust
              them as needed.
            </p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.TRANSACTIONS} />}>
            <ArrowLeft /> Back to transactions
          </Button>
        </header>

        {isEditing && transactionLoading ? (
          <p className='rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500'>
            Loading transaction...
          </p>
        ) : isEditing && (transactionError || !transaction) ? (
          <p
            role='alert'
            className='rounded-lg border border-slate-200 bg-white p-6 text-sm text-rose-700'
          >
            {transactionError instanceof Error
              ? transactionError.message
              : 'Transaction not found.'}
          </p>
        ) : (
          <form
            onSubmit={event => void save(event)}
            className='rounded-lg border border-slate-200 bg-white p-5'
          >
            <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
              <div className='space-y-5'>
                <CommonTransactionFields
                  form={form}
                  onFieldChange={updateField}
                  onDirectionChange={handleDirectionChange}
                  onTypeChange={handleTypeChange}
                />

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Member & layout' color='blue' />
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {isMemberVisible(form.type) ? (
                      <MemberSelector
                        form={form}
                        members={members}
                        memberLookup={memberLookup}
                        isMemberOptionsOpen={isMemberOptionsOpen}
                        membersLoading={membersLoading}
                        onLookupChange={setMemberLookup}
                        onToggleMembers={setIsMemberOptionsOpen}
                        onSelectMember={selectMember}
                      />
                    ) : null}

                    {isPartyVisible(form.type) ? (
                      <PartySelector
                        form={form}
                        parties={filteredParties}
                        onFieldChange={updateField}
                      />
                    ) : null}

                    {isLayoutVisible(form.type) && form.type !== 'LAYOUT' ? (
                      <LayoutSelector
                        form={form}
                        layouts={layouts}
                        field='layoutId'
                        label='Layout'
                        onFieldChange={updateField}
                      />
                    ) : null}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Accounts & payment' color='amber' />
                  <div className='space-y-4'>
                    {form.type === 'BANK' && (
                      <AccountFields form={form} accounts={accounts} onFieldChange={updateField} />
                    )}
                    <PaymentFields form={form} onFieldChange={updateField} />
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Amounts' color='emerald' />
                  {renderTypeSpecificFields()}
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Notes' color='rose' />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                      <span>Description</span>
                      <input
                        type='text'
                        value={form.description ?? ''}
                        onChange={event => updateField('description', event.target.value || null)}
                        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                      />
                    </label>
                    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                      <span>Remarks</span>
                      <input
                        type='text'
                        value={form.remarks ?? ''}
                        onChange={event => updateField('remarks', event.target.value || null)}
                        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                      />
                    </label>
                  </div>
                </section>
              </div>

              <aside className='space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-5'>
                <h2 className='text-sm font-semibold text-slate-800'>Cashbook reference</h2>
                <CashbookReference cashbookNo={form.cashbookNo} cashbookPage={form.cashbookPage} />
              </aside>
            </div>

            <footer className='mt-5 flex justify-end gap-2 border-t border-slate-200 pt-4'>
              <Button
                type='button'
                variant='outline'
                render={<Link to={ROUTES.ADMIN.TRANSACTIONS} />}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSaving}>
                {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Create transaction'}
              </Button>
            </footer>
          </form>
        )}
      </div>
    </main>
  );
}
