import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

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
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

async function getAllMembers() {
  const firstPage = await getMembers({ page: 1, limit: 100 });
  const members = [...firstPage.data.items];

  for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
    const response = await getMembers({ page, limit: 100 });
    members.push(...response.data.items);
  }

  return members;
}

const shareAmountFields = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['applicationFeeAmount', 'Application fee'],
  ['admissionFeeAmount', 'Admission fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books/forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
] as const;

const memberRequiredTypes = new Set(['SHARE', 'LAYOUT']);
const memberVisibleTypes = new Set(['SHARE', 'LAYOUT', 'INCOME', 'ADVANCE', 'OTHER']);
const partyVisibleTypes = new Set(['EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER']);
const layoutVisibleTypes = new Set(['LAYOUT', 'ADVANCE', 'OTHER']);
const accountRequiredTypes = new Set(['BANK', 'EXPENSE', 'INCOME', 'ADVANCE', 'ASSET']);

function blankTransaction(memberId = ''): TransactionPayload {
  return {
    cashbookNo: '',
    cashbookPage: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    direction: 'IN',
    type: 'OTHER',
    subType: '',
    memberId: null,
    partyId: null,
    layoutId: null,
    fromLayoutId: null,
    toLayoutId: null,
    shareAmount: '0',
    shareFeeAmount: '0',
    applicationFeeAmount: '0',
    admissionFeeAmount: '0',
    membershipFeeAmount: '0',
    siteDepositAmount: '0',
    welfareFundAmount: '0',
    booksFormsAmount: '0',
    miscellaneousAmount: '0',
    otherAmount: '0',
    totalAmount: '0',
    fromAccountId: null,
    toAccountId: null,
    receiptNo: null,
    paymentMode: null,
    chequeNo: null,
    chequeDate: null,
    bankReferenceNo: null,
    referenceTransactionId: null,
    description: null,
    remarks: null,
    createdBy: memberId,
    updatedBy: null,
  };
}

function inputValue(value: string | number | null) {
  return value === null ? '' : String(value);
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
  const [isCashbookImageMissing, setIsCashbookImageMissing] = useState(false);
  const [form, setForm] = useState<TransactionPayload>(() =>
    blankTransaction(user?.memberId ?? ''),
  );
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
  const memberRequired = memberRequiredTypes.has(form.type);
  const memberVisible = memberVisibleTypes.has(form.type);
  const partyVisible = partyVisibleTypes.has(form.type);
  const layoutVisible = layoutVisibleTypes.has(form.type);
  const accountRequired = accountRequiredTypes.has(form.type);
  const showShareFees = form.type === 'SHARE' && form.direction === 'IN';

  useEffect(() => {
    if (transaction) {
      setForm({ ...transaction, updatedBy: user?.memberId ?? '' });
    }
  }, [transaction, user?.memberId]);

  useEffect(() => {
    const transactions = transactionListData?.data.items ?? [];
    if (isEditing || transactions.length === 0) return;

    const lastTransaction = transactions.reduce((latest, candidate) =>
      BigInt(candidate.id) > BigInt(latest.id) ? candidate : latest,
    );
    setForm(previous => ({
      ...previous,
      cashbookNo:
        previous.cashbookNo === '' ? (lastTransaction.cashbookNo ?? '') : previous.cashbookNo,
      cashbookPage:
        previous.cashbookPage === '' ? (lastTransaction.cashbookPage ?? '') : previous.cashbookPage,
    }));
  }, [isEditing, transactionListData]);

  const matchingMembers = members.filter(member =>
    [member.memberId, member.memberCode, member.name, member.mobile ?? ''].some(value =>
      value.toLocaleLowerCase().includes(memberLookup.trim().toLocaleLowerCase()),
    ),
  );
  const selectedMember = members.find(member => member.memberId === form.memberId);
  useEffect(() => {
    if (isEditing || form.direction !== 'IN' || form.type !== 'SHARE' || !selectedMember) {
      return;
    }

    setForm(previous => ({
      ...previous,
      receiptNo: selectedMember.recieptNo ?? '',
      transactionDate: selectedMember.joinDate?.slice(0, 10) || previous.transactionDate,
    }));
  }, [form.direction, form.type, isEditing, selectedMember]);

  const cashbookNoValue = inputValue(form.cashbookNo);
  const cashbookPageValue = inputValue(form.cashbookPage);
  const cashbookImageBase =
    /^\d+$/.test(cashbookNoValue) && /^\d+$/.test(cashbookPageValue)
      ? `/cashbook/${cashbookNoValue}/${cashbookPageValue}`
      : null;
  const memberInputValue = isMemberOptionsOpen
    ? memberLookup
    : selectedMember
      ? `${selectedMember.name} (${selectedMember.memberCode}) · ID ${selectedMember.memberId}`
      : '';

  const setField = (field: keyof TransactionPayload, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const selectMember = (memberId: string) => {
    const member = members.find(candidate => candidate.memberId === memberId);
    setForm(previous => ({
      ...previous,
      memberId,
      ...(member && !isEditing && previous.direction === 'IN' && previous.type === 'SHARE'
        ? {
            receiptNo: member.recieptNo ?? '',
            transactionDate: member.joinDate?.slice(0, 10) || previous.transactionDate,
          }
        : {}),
    }));
  };

  useEffect(() => {
    setIsCashbookImageMissing(false);
  }, [cashbookImageBase]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (memberRequired && !form.memberId) {
      toast.error('Select a member for this transaction type.');
      return;
    }
    if (form.type === 'LAYOUT' && !form.layoutId) {
      toast.error('Select a layout for this transaction type.');
      return;
    }
    if (
      ((accountRequired || form.direction === 'TRANSFER') &&
        form.direction === 'IN' &&
        !form.toAccountId) ||
      ((accountRequired || form.direction === 'TRANSFER') &&
        form.direction === 'OUT' &&
        !form.fromAccountId) ||
      (form.direction === 'TRANSFER' && (!form.fromAccountId || !form.toAccountId))
    ) {
      toast.error('Select the account required for this transaction direction.');
      return;
    }

    const actorMemberId = user?.memberId;
    if (!actorMemberId) {
      toast.error('Your signed-in account could not be identified. Please sign in again.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: TransactionPayload = {
        ...form,
        cashbookNo: form.cashbookNo === '' ? null : Number(form.cashbookNo),
        cashbookPage: form.cashbookPage === '' ? null : Number(form.cashbookPage),
        shareAmount: form.type === 'SHARE' ? form.shareAmount : '0',
        shareFeeAmount: showShareFees ? form.shareFeeAmount : '0',
        applicationFeeAmount: showShareFees ? form.applicationFeeAmount : '0',
        admissionFeeAmount: showShareFees ? form.admissionFeeAmount : '0',
        membershipFeeAmount: showShareFees ? form.membershipFeeAmount : '0',
        siteDepositAmount: '0',
        welfareFundAmount: showShareFees ? form.welfareFundAmount : '0',
        booksFormsAmount: showShareFees ? form.booksFormsAmount : '0',
        miscellaneousAmount: showShareFees ? form.miscellaneousAmount : '0',
        memberId: memberVisible ? form.memberId || null : null,
        partyId: partyVisible ? form.partyId || null : null,
        layoutId: layoutVisible ? form.layoutId || null : null,
        fromLayoutId:
          form.type === 'SHARE' || form.direction === 'IN' || form.direction === 'TRANSFER'
            ? null
            : form.fromLayoutId || null,
        toLayoutId:
          form.type === 'SHARE' || form.direction === 'IN' || form.direction === 'TRANSFER'
            ? null
            : form.toLayoutId || null,
        fromAccountId: form.fromAccountId || null,
        toAccountId: form.toAccountId || null,
        referenceTransactionId: form.referenceTransactionId || null,
        receiptNo: form.receiptNo || null,
        paymentMode: form.paymentMode || null,
        chequeNo: form.chequeNo || null,
        chequeDate: form.chequeDate || null,
        bankReferenceNo: form.bankReferenceNo || null,
        description: form.description || null,
        remarks: form.remarks || null,
        ...(isEditing ? { updatedBy: actorMemberId } : { createdBy: actorMemberId }),
      };
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

  const textField = (
    name: keyof TransactionPayload,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700' key={name}>
      {label}
      <input
        type={type}
        required={required}
        value={inputValue(form[name] as string | number | null)}
        onChange={event => setField(name, event.target.value)}
        step={type === 'number' ? '0.01' : undefined}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
      />
    </label>
  );

  const selectField = (
    name: keyof TransactionPayload,
    label: string,
    options: string[],
    required = false,
  ) => (
    <label className='grid gap-1.5 text-sm font-medium text-slate-700' key={name}>
      {label}
      <select
        required={required}
        value={inputValue(form[name] as string | number | null)}
        onChange={event => {
          const value = event.target.value;
          if (name === 'type') {
            setForm(previous => ({
              ...previous,
              type: value as TransactionPayload['type'],
              memberId: memberVisibleTypes.has(value) ? previous.memberId : null,
              partyId: partyVisibleTypes.has(value) ? previous.partyId : null,
              layoutId: layoutVisibleTypes.has(value) ? previous.layoutId : null,
              shareAmount: value === 'SHARE' ? previous.shareAmount : '0',
              shareFeeAmount: value === 'SHARE' ? previous.shareFeeAmount : '0',
              applicationFeeAmount: value === 'SHARE' ? previous.applicationFeeAmount : '0',
              admissionFeeAmount: value === 'SHARE' ? previous.admissionFeeAmount : '0',
              membershipFeeAmount: value === 'SHARE' ? previous.membershipFeeAmount : '0',
              siteDepositAmount: '0',
              welfareFundAmount: value === 'SHARE' ? previous.welfareFundAmount : '0',
              booksFormsAmount: value === 'SHARE' ? previous.booksFormsAmount : '0',
              miscellaneousAmount: value === 'SHARE' ? previous.miscellaneousAmount : '0',
              fromLayoutId: null,
              toLayoutId: null,
            }));
            return;
          }
          if (name === 'direction') {
            setForm(previous => ({
              ...previous,
              direction: value as TransactionPayload['direction'],
              shareFeeAmount: value === 'IN' ? previous.shareFeeAmount : '0',
              applicationFeeAmount: value === 'IN' ? previous.applicationFeeAmount : '0',
              admissionFeeAmount: value === 'IN' ? previous.admissionFeeAmount : '0',
              membershipFeeAmount: value === 'IN' ? previous.membershipFeeAmount : '0',
              welfareFundAmount: value === 'IN' ? previous.welfareFundAmount : '0',
              booksFormsAmount: value === 'IN' ? previous.booksFormsAmount : '0',
              miscellaneousAmount: value === 'IN' ? previous.miscellaneousAmount : '0',
              fromLayoutId: null,
              toLayoutId: null,
            }));
            return;
          }
          setField(name, value);
        }}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
      >
        {!required && <option value=''>None</option>}
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

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
                <section>
                  <FormSectionHeading title='Transaction' color='teal' />
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                      Cashbook number
                      <input
                        type='number'
                        step='1'
                        value={inputValue(form.cashbookNo)}
                        onChange={event => setField('cashbookNo', event.target.value)}
                        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                      />
                    </label>
                    <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                      Cashbook page
                      <input
                        type='number'
                        step='1'
                        value={inputValue(form.cashbookPage)}
                        onChange={event => setField('cashbookPage', event.target.value)}
                        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                      />
                    </label>
                    {textField('transactionDate', 'Date', 'date', true)}
                    {selectField('direction', 'Direction', ['IN', 'OUT', 'TRANSFER'], true)}
                    {selectField(
                      'type',
                      'Type',
                      ['SHARE', 'LAYOUT', 'BANK', 'EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'],
                      true,
                    )}
                    {textField('subType', 'Sub-type', 'text', true)}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Member & layout' color='blue' />
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {memberVisible && (
                      <label className='relative grid gap-1.5 text-sm font-medium text-slate-700'>
                        Member
                        <input
                          required={memberRequired}
                          role='combobox'
                          aria-autocomplete='list'
                          aria-expanded={isMemberOptionsOpen}
                          aria-controls='transaction-member-options'
                          value={memberInputValue}
                          onFocus={() => {
                            setMemberLookup('');
                            setIsMemberOptionsOpen(true);
                          }}
                          onChange={event => {
                            setMemberLookup(event.target.value);
                            setIsMemberOptionsOpen(true);
                          }}
                          onKeyDown={event => {
                            if (event.key === 'Escape') setIsMemberOptionsOpen(false);
                            if (
                              event.key === 'Enter' &&
                              isMemberOptionsOpen &&
                              matchingMembers[0]
                            ) {
                              event.preventDefault();
                              selectMember(matchingMembers[0].memberId);
                              setMemberLookup('');
                              setIsMemberOptionsOpen(false);
                            }
                          }}
                          placeholder={
                            membersLoading ? 'Loading members...' : 'Select or search members...'
                          }
                          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                        />
                        {isMemberOptionsOpen && (
                          <div
                            id='transaction-member-options'
                            role='listbox'
                            className='absolute left-0 right-0 top-full z-20 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg'
                          >
                            <button
                              type='button'
                              role='option'
                              aria-selected={!form.memberId}
                              onClick={() => {
                                setField('memberId', '');
                                setMemberLookup('');
                                setIsMemberOptionsOpen(false);
                              }}
                              className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-600 hover:bg-slate-50'
                            >
                              No member
                            </button>
                            {matchingMembers.map(member => (
                              <button
                                key={member.memberId}
                                type='button'
                                role='option'
                                aria-selected={member.memberId === form.memberId}
                                onClick={() => {
                                  selectMember(member.memberId);
                                  setMemberLookup('');
                                  setIsMemberOptionsOpen(false);
                                }}
                                className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-900 hover:bg-slate-50'
                              >
                                {member.name} ({member.memberCode}) · {member.mobile || 'No mobile'}{' '}
                                · ID {member.memberId}
                              </button>
                            ))}
                            {!membersLoading && matchingMembers.length === 0 && (
                              <p className='px-3 py-2 text-sm font-normal text-slate-500'>
                                No matching members.
                              </p>
                            )}
                          </div>
                        )}
                      </label>
                    )}
                    {partyVisible && (
                      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                        Party
                        <select
                          value={inputValue(form.partyId)}
                          onChange={event => setField('partyId', event.target.value)}
                          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                        >
                          <option value=''>No party</option>
                          {parties.map(party => (
                            <option key={party.id} value={party.id}>
                              {party.name} ({party.partyType}) · ID {party.id}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {layoutVisible && (
                      <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                        Layout
                        <select
                          required={form.type === 'LAYOUT'}
                          value={inputValue(form.layoutId)}
                          onChange={event => setField('layoutId', event.target.value)}
                          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                        >
                          <option value=''>No layout</option>
                          {layouts.map(layout => (
                            <option key={layout.id} value={layout.id}>
                              {layout.name} ({layout.layoutCode}) · ID {layout.id}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {layoutVisible &&
                      form.direction === 'OUT' &&
                      (['fromLayoutId', 'toLayoutId'] as const).map((field, index) => (
                        <label
                          className='grid gap-1.5 text-sm font-medium text-slate-700'
                          key={field}
                        >
                          {index === 0 ? 'Source layout' : 'Destination layout'}
                          <select
                            value={inputValue(form[field])}
                            onChange={event => setField(field, event.target.value)}
                            className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                          >
                            <option value=''>No layout</option>
                            {layouts.map(layout => (
                              <option key={layout.id} value={layout.id}>
                                {layout.name} ({layout.layoutCode}) · ID {layout.id}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Accounts & payment' color='amber' />
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {(['fromAccountId', 'toAccountId'] as const).map((field, index) => (
                      <label
                        className='grid gap-1.5 text-sm font-medium text-slate-700'
                        key={field}
                      >
                        {index === 0 ? 'Source account' : 'Destination account'}
                        <select
                          value={inputValue(form[field])}
                          onChange={event => setField(field, event.target.value)}
                          required={
                            (accountRequired || form.direction === 'TRANSFER') &&
                            ((form.direction === 'IN' && field === 'toAccountId') ||
                              (form.direction === 'OUT' && field === 'fromAccountId') ||
                              form.direction === 'TRANSFER')
                          }
                          className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                        >
                          <option value=''>No account</option>
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.accountCode}) · ID {account.id}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                    {selectField('paymentMode', 'Payment mode', [
                      'CASH',
                      'CHEQUE',
                      'BANK_TRANSFER',
                      'UPI',
                      'OTHER',
                    ])}
                    {textField('receiptNo', 'Receipt number')}
                    {textField('chequeNo', 'Cheque number')}
                    {textField('chequeDate', 'Cheque date', 'date')}
                    {textField('bankReferenceNo', 'Bank reference')}
                    {textField('referenceTransactionId', 'Reference transaction ID')}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Amounts' color='emerald' />
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {form.type === 'SHARE' &&
                      shareAmountFields
                        .filter(([name]) => name === 'shareAmount' || showShareFees)
                        .map(([name, label]) => textField(name, label, 'number'))}
                    {textField('otherAmount', 'Other amount', 'number')}
                  </div>
                </section>

                <section className='border-t border-slate-200 pt-4'>
                  <FormSectionHeading title='Notes' color='rose' />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {textField('description', 'Description')}
                    {textField('remarks', 'Remarks')}
                  </div>
                </section>
              </div>

              <aside className='space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3 lg:sticky lg:top-5'>
                <h2 className='text-sm font-semibold text-slate-800'>Cashbook reference</h2>
                {cashbookImageBase && !isCashbookImageMissing ? (
                  <img
                    key={cashbookImageBase}
                    src={`${cashbookImageBase}.jpg`}
                    alt={`Cashbook ${cashbookNoValue}, page ${cashbookPageValue}`}
                    onError={event => {
                      const image = event.currentTarget;
                      if (image.src.endsWith('.jpg')) {
                        image.src = `${cashbookImageBase}.jpeg`;
                      } else {
                        setIsCashbookImageMissing(true);
                      }
                    }}
                    className='max-h-[95vh] w-full'
                  />
                ) : (
                  <p className='flex min-h-48 items-center justify-center rounded border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500'>
                    {isCashbookImageMissing
                      ? 'No reference image found for this cashbook page.'
                      : 'Enter a cashbook number and page to view the reference image.'}
                  </p>
                )}
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
