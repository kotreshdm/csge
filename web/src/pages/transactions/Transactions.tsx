import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { getAccounts } from '../../api/accounts';
import { getLayouts } from '../../api/layouts';
import { getMembers } from '../../api/members';
import { getParties } from '../../api/parties';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from '../../api/transactions';
import type { Transaction, TransactionPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
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

const amountFields = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['applicationFeeAmount', 'Application fee'],
  ['admissionFeeAmount', 'Admission fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['siteDepositAmount', 'Site deposit'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books/forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
  ['otherAmount', 'Other amount'],
] as const;

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

export default function Transactions() {
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);
  const [search, setSearch] = useState('');
  const [memberLookup, setMemberLookup] = useState('');
  const [isMemberOptionsOpen, setIsMemberOptionsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<TransactionPayload>(() =>
    blankTransaction(user?.memberId ?? ''),
  );
  const [isSaving, setIsSaving] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
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
  const matchingMembers = members.filter(member =>
    [member.memberId, member.memberCode, member.name, member.mobile ?? ''].some(value =>
      value.toLocaleLowerCase().includes(memberLookup.trim().toLocaleLowerCase()),
    ),
  );
  const selectedMember = members.find(member => member.memberId === form.memberId);
  const memberInputValue = isMemberOptionsOpen
    ? memberLookup
    : selectedMember
      ? `${selectedMember.name} (${selectedMember.memberCode}) · ID ${selectedMember.memberId}`
      : '';
  const transactions = data?.data.items ?? [];
  const filtered = transactions.filter(transaction =>
    [
      String(transaction.cashbookNo ?? ''),
      String(transaction.cashbookPage ?? ''),
      transaction.subType,
      transaction.type,
      transaction.description ?? '',
    ].some(value => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success(response.message || 'Transaction deleted.');
    },
    onError: mutationError =>
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Unable to delete transaction.',
      ),
  });

  const setField = (field: keyof TransactionPayload, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const openCreate = () => {
    setEditing(null);
    setMemberLookup('');
    setForm(blankTransaction(user?.memberId ?? ''));
    setIsFormOpen(true);
  };

  const openEdit = async (transaction: Transaction) => {
    try {
      const response = await getTransaction(transaction.id);
      const record = response.data;
      setEditing(record);
      const selected = members.find(member => member.memberId === record.memberId);
      setMemberLookup(selected ? `${selected.name} ${selected.memberCode}` : '');
      setForm({ ...record, updatedBy: user?.memberId ?? '' });
      setIsFormOpen(true);
    } catch (loadError) {
      toast.error(loadError instanceof Error ? loadError.message : 'Unable to load transaction.');
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const payload: TransactionPayload = {
        ...form,
        cashbookNo: form.cashbookNo === '' ? null : Number(form.cashbookNo),
        cashbookPage: form.cashbookPage === '' ? null : Number(form.cashbookPage),
        memberId: form.memberId || null,
        partyId: form.partyId || null,
        layoutId: form.layoutId || null,
        fromLayoutId: form.fromLayoutId || null,
        toLayoutId: form.toLayoutId || null,
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
        ...(editing
          ? { updatedBy: user?.memberId ?? form.updatedBy ?? null }
          : { createdBy: user?.memberId ?? form.createdBy }),
      };
      const response = editing
        ? await updateTransaction(editing.id, payload)
        : await createTransaction(payload);
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsFormOpen(false);
      toast.success(response.message || 'Transaction saved.');
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
        value={inputValue(form[name] as string | null)}
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
        value={inputValue(form[name] as string | null)}
        onChange={event => setField(name, event.target.value)}
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
        <div className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Transactions</h1>
            <p className='mt-1 text-sm text-slate-500'>Record and review financial activity.</p>
          </div>
          <label className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-2.5 size-4 text-slate-400' />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder='Search transactions'
              className='h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm'
            />
          </label>
          <Button onClick={openCreate}>
            <Plus /> Add transaction
          </Button>
        </div>
        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            Showing {filtered.length} of {transactions.length} transactions
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading transactions...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Failed to load transactions.'}
            </p>
          ) : filtered.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No transactions found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Date</th>
                    <th className='px-4 py-3'>Cashbook</th>
                    <th className='px-4 py-3'>Direction</th>
                    <th className='px-4 py-3'>Type</th>
                    <th className='px-4 py-3 text-right'>Amount</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(transaction => (
                    <tr
                      key={transaction.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='whitespace-nowrap px-4 py-3'>
                        {transaction.transactionDate.slice(0, 10)}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='font-medium text-slate-900'>
                          No. {transaction.cashbookNo ?? '—'} · Page{' '}
                          {transaction.cashbookPage ?? '—'}
                        </span>
                        <span className='ml-2 text-slate-500'>{transaction.subType}</span>
                      </td>
                      <td className='px-4 py-3'>{transaction.direction}</td>
                      <td className='px-4 py-3'>{transaction.type}</td>
                      <td className='whitespace-nowrap px-4 py-3 text-right'>
                        {Number(transaction.totalAmount).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={`Edit cashbook entry ${transaction.cashbookNo ?? ''}`}
                            title='Edit transaction'
                            onClick={() => void openEdit(transaction)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete cashbook entry ${transaction.cashbookNo ?? ''}`}
                            title='Delete transaction'
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete cashbook entry ${transaction.cashbookNo ?? '(no number)'}?`,
                                )
                              )
                                deleteMutation.mutate(transaction.id);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {isFormOpen && (
        <div className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 sm:p-8'>
          <section
            role='dialog'
            aria-modal='true'
            aria-labelledby='transaction-form-title'
            className='my-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white shadow-xl'
          >
            <header className='flex items-center border-b border-slate-200 px-5 py-4'>
              <div className='mr-auto'>
                <h2 id='transaction-form-title' className='text-lg font-semibold text-slate-900'>
                  {editing ? 'Edit transaction' : 'New transaction'}
                </h2>
                <p className='text-sm text-slate-500'>Enter transaction details and amounts.</p>
              </div>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Close form'
                onClick={() => setIsFormOpen(false)}
              >
                <X />
              </Button>
            </header>
            <form onSubmit={event => void save(event)} className='space-y-5 p-5'>
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
                <label className='relative grid gap-1.5 text-sm font-medium text-slate-700'>
                  Member
                  <input
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
                      if (event.key === 'Enter' && isMemberOptionsOpen && matchingMembers[0]) {
                        event.preventDefault();
                        setField('memberId', matchingMembers[0].memberId);
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
                            setField('memberId', member.memberId);
                            setMemberLookup('');
                            setIsMemberOptionsOpen(false);
                          }}
                          className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-900 hover:bg-slate-50'
                        >
                          {member.name} ({member.memberCode}) · {member.mobile || 'No mobile'} · ID {member.memberId}
                        </button>
                      ))}
                      {!membersLoading && matchingMembers.length === 0 && (
                        <p className='px-3 py-2 text-sm font-normal text-slate-500'>No matching members.</p>
                      )}
                    </div>
                  )}
                </label>
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
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  Layout
                  <select
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
                {(['fromLayoutId', 'toLayoutId'] as const).map((field, index) => (
                  <label className='grid gap-1.5 text-sm font-medium text-slate-700' key={field}>
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
                {(['fromAccountId', 'toAccountId'] as const).map((field, index) => (
                  <label className='grid gap-1.5 text-sm font-medium text-slate-700' key={field}>
                    {index === 0 ? 'Source account' : 'Destination account'}
                    <select
                      value={inputValue(form[field])}
                      onChange={event => setField(field, event.target.value)}
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
              <div className='border-t border-slate-200 pt-4'>
                <h3 className='mb-3 text-sm font-semibold text-slate-800'>Amounts</h3>
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {amountFields.map(([name, label]) => textField(name, label, 'number'))}
                  {textField('totalAmount', 'Total amount', 'number')}
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                {textField('description', 'Description')}
                {textField('remarks', 'Remarks')}
                {!user?.memberId &&
                  textField(editing ? 'updatedBy' : 'createdBy', 'Audit member ID', 'text', true)}
              </div>
              <footer className='flex justify-end gap-2 border-t border-slate-200 pt-4'>
                <Button type='button' variant='outline' onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSaving}>
                  {isSaving ? 'Saving...' : editing ? 'Save changes' : 'Create transaction'}
                </Button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
