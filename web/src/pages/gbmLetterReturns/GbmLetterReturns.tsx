import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  createGbmLetterReturn,
  deleteGbmLetterReturn,
  getGbmLetterReturns,
  updateGbmLetterReturn,
} from '../../api/gbmLetterReturns';
import { getMembers } from '../../api/members';
import type {
  GbmLetterReturn,
  GbmLetterReturnPayload,
  PaginatedMembersResponse,
} from '../../api/types';
import { Button } from '@/components/ui/button';

type MemberOption = PaginatedMembersResponse['items'][number];

const createEmptyForm = (lastRecord: GbmLetterReturn | null): GbmLetterReturnPayload => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    memberId: '',
    gbmDate: lastRecord?.gbmDate.slice(0, 10) ?? today,
    letterDate: lastRecord?.letterDate?.slice(0, 10) ?? '',
    returnDate: lastRecord?.returnDate.slice(0, 10) ?? today,
    returnReason: '',
    remarks: '',
  };
};

async function getAllMembers() {
  const firstPage = await getMembers({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const members = [...firstPage.data.items];

  for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
    const response = await getMembers({ page, limit: 100, sortBy: 'name', sortOrder: 'asc' });
    members.push(...response.data.items);
  }

  return members;
}

function GbmLetterReturnModal({
  record,
  lastRecord,
  members,
  saving,
  error,
  onClose,
  onSave,
}: {
  record: GbmLetterReturn | null;
  lastRecord: GbmLetterReturn | null;
  members: MemberOption[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: GbmLetterReturnPayload) => void;
}) {
  const [form, setForm] = useState<GbmLetterReturnPayload>(() =>
    record
      ? {
          memberId: record.memberId,
          gbmDate: record.gbmDate.slice(0, 10),
          letterDate: record.letterDate?.slice(0, 10) ?? '',
          returnDate: record.returnDate.slice(0, 10),
          returnReason: record.returnReason ?? '',
          remarks: record.remarks ?? '',
        }
      : createEmptyForm(lastRecord),
  );
  const [memberLookup, setMemberLookup] = useState('');
  const [memberOptionsOpen, setMemberOptionsOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const selectedMember = members.find(member => member.memberId === form.memberId);
  const matchingMembers = members.filter(member =>
    [member.memberId, member.memberCode, member.name, member.mobile ?? ''].some(value =>
      value.toLocaleLowerCase().includes(memberLookup.trim().toLocaleLowerCase()),
    ),
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.returnDate < form.gbmDate) {
      setValidationError('Return date cannot be earlier than the GBM date.');
      return;
    }
    onSave(form);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='gbm-letter-return-title'
        className='w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl'
      >
        <header className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
          <h2 id='gbm-letter-return-title' className='text-lg font-semibold text-slate-900'>
            {record ? 'Edit GBM letter return' : 'Add GBM letter return'}
          </h2>
          <Button type='button' variant='ghost' size='icon-sm' aria-label='Close' onClick={onClose}>
            <X />
          </Button>
        </header>
        <form onSubmit={submit} className='space-y-4 p-5'>
          <div className='relative grid gap-1.5 text-sm font-medium text-slate-700'>
            <span>Member *</span>
            <input
              required
              role='combobox'
              aria-autocomplete='list'
              aria-expanded={memberOptionsOpen}
              aria-controls='gbm-member-options'
              value={
                memberOptionsOpen
                  ? memberLookup
                  : selectedMember
                    ? `${selectedMember.name} (${selectedMember.memberCode}) · ID ${selectedMember.memberId}`
                    : ''
              }
              onFocus={() => {
                setMemberLookup('');
                setMemberOptionsOpen(true);
              }}
              onChange={event => {
                setMemberLookup(event.target.value);
                setMemberOptionsOpen(true);
                setForm(previous => ({ ...previous, memberId: '' }));
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') setMemberOptionsOpen(false);
                if (event.key === 'Enter' && memberOptionsOpen && matchingMembers[0]) {
                  event.preventDefault();
                  setForm(previous => ({ ...previous, memberId: matchingMembers[0].memberId }));
                  setMemberLookup('');
                  setMemberOptionsOpen(false);
                }
              }}
              placeholder='Search by member name, code, or mobile...'
              className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
            />
            {memberOptionsOpen && (
              <div
                id='gbm-member-options'
                role='listbox'
                className='absolute left-0 right-0 top-full z-30 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg'
              >
                {matchingMembers.map(member => (
                  <button
                    key={member.memberId}
                    type='button'
                    role='option'
                    aria-selected={member.memberId === form.memberId}
                    onClick={() => {
                      setForm(previous => ({ ...previous, memberId: member.memberId }));
                      setMemberLookup('');
                      setMemberOptionsOpen(false);
                    }}
                    className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-900 hover:bg-slate-50'
                  >
                    {member.name} ({member.memberCode}) · {member.mobile || 'No mobile'} · ID{' '}
                    {member.memberId}
                  </button>
                ))}
                {matchingMembers.length === 0 && (
                  <p className='px-3 py-2 text-sm font-normal text-slate-500'>
                    No matching members.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className='grid gap-4 sm:grid-cols-3'>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>GBM date *</span>
              <input
                required
                type='date'
                value={form.gbmDate}
                onChange={event => {
                  setForm(previous => ({ ...previous, gbmDate: event.target.value }));
                  setValidationError('');
                }}
                className='h-10 min-w-0 rounded-md border border-slate-300 bg-white px-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>Letter date</span>
              <input
                type='date'
                value={form.letterDate}
                onChange={event =>
                  setForm(previous => ({ ...previous, letterDate: event.target.value }))
                }
                className='h-10 min-w-0 rounded-md border border-slate-300 bg-white px-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>Return date *</span>
              <input
                required
                type='date'
                min={form.gbmDate}
                value={form.returnDate}
                onChange={event => {
                  setForm(previous => ({ ...previous, returnDate: event.target.value }));
                  setValidationError('');
                }}
                className='h-10 min-w-0 rounded-md border border-slate-300 bg-white px-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
          </div>
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            <span>Return reason</span>
            <input
              value={form.returnReason}
              onChange={event =>
                setForm(previous => ({ ...previous, returnReason: event.target.value }))
              }
              className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
            />
          </label>
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            <span>Remarks</span>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={event =>
                setForm(previous => ({ ...previous, remarks: event.target.value }))
              }
              className='rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
            />
          </label>
          {(validationError || error) && (
            <p role='alert' className='text-sm text-rose-700'>
              {validationError || error}
            </p>
          )}
          <footer className='flex justify-end gap-2 border-t border-slate-200 pt-4'>
            <Button type='button' variant='outline' disabled={saving} onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={saving || members.length === 0}>
              {saving ? 'Saving...' : record ? 'Save changes' : 'Add record'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function GbmLetterReturns() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GbmLetterReturn | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GbmLetterReturn | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({ queryKey: ['gbm-letter-returns'], queryFn: getGbmLetterReturns });
  const membersQuery = useQuery({ queryKey: ['gbm-member-options'], queryFn: getAllMembers });
  const records = recordsQuery.data?.data.items ?? [];
  const members = membersQuery.data ?? [];
  const lastRecord = records.reduce<GbmLetterReturn | null>(
    (latest, record) =>
      latest === null || BigInt(record.id) > BigInt(latest.id) ? record : latest,
    null,
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormError('');
  };

  const saveRecord = async (payload: GbmLetterReturnPayload) => {
    setIsSaving(true);
    setFormError('');
    try {
      const response = editingRecord
        ? await updateGbmLetterReturn(editingRecord.id, payload)
        : await createGbmLetterReturn(payload);
      await queryClient.invalidateQueries({ queryKey: ['gbm-letter-returns'] });
      closeModal();
      toast.success(response.message);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save GBM letter return.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeRecord = async () => {
    if (!deleteTarget) return;
    try {
      const response = await deleteGbmLetterReturn(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['gbm-letter-returns'] });
      setDeleteTarget(null);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete GBM letter return.');
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <header className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>GBM letter returns</h1>
            <p className='mt-1 text-sm text-slate-500'>Track member letters returned after GBM.</p>
          </div>
          <Button
            type='button'
            onClick={() => {
              setEditingRecord(null);
              setFormError('');
              setIsModalOpen(true);
            }}
          >
            <Plus /> Add return
          </Button>
        </header>
        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            {records.length} return records
          </div>
          {recordsQuery.isLoading || membersQuery.isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading GBM letter returns...</p>
          ) : recordsQuery.error || membersQuery.error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {recordsQuery.error instanceof Error
                ? recordsQuery.error.message
                : membersQuery.error instanceof Error
                  ? membersQuery.error.message
                  : 'Unable to load GBM letter returns.'}
            </p>
          ) : records.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No GBM letter returns found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Member code</th>
                    <th className='px-4 py-3'>Member</th>
                    <th className='px-4 py-3'>GBM date</th>
                    <th className='px-4 py-3'>Letter date</th>
                    <th className='px-4 py-3'>Return date</th>
                    <th className='px-4 py-3'>Reason</th>
                    <th className='px-4 py-3'>Remarks</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => (
                    <tr
                      key={record.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='whitespace-nowrap px-4 py-3'>{record.member.memberCode}</td>
                      <td className='px-4 py-3 font-medium'>{record.member.name}</td>
                      <td className='whitespace-nowrap px-4 py-3'>{record.gbmDate.slice(0, 10)}</td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {record.letterDate?.slice(0, 10) ?? '-'}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {record.returnDate.slice(0, 10)}
                      </td>
                      <td className='max-w-xs truncate px-4 py-3'>{record.returnReason || '-'}</td>
                      <td className='max-w-xs truncate px-4 py-3'>{record.remarks || '-'}</td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon-sm'
                            aria-label={`Edit return for ${record.member.name}`}
                            title='Edit return'
                            onClick={() => {
                              setEditingRecord(record);
                              setFormError('');
                              setIsModalOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete return for ${record.member.name}`}
                            title='Delete return'
                            onClick={() => setDeleteTarget(record)}
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

      {isModalOpen &&
        (membersQuery.error ? (
          <div
            role='alert'
            className='fixed inset-x-4 bottom-4 z-50 rounded-md bg-rose-50 p-4 text-sm text-rose-700'
          >
            Unable to load member options.
          </div>
        ) : (
          <GbmLetterReturnModal
            record={editingRecord}
            lastRecord={lastRecord}
            members={members}
            saving={isSaving}
            error={formError}
            onClose={closeModal}
            onSave={saveRecord}
          />
        ))}

      {deleteTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-gbm-return-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-gbm-return-title' className='text-lg font-semibold text-slate-900'>
              Delete GBM letter return?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              Remove the return record for {deleteTarget.member.name}?
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type='button' variant='destructive' onClick={removeRecord}>
                Delete
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
