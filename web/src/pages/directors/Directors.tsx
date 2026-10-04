import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { createDirector, deleteDirector, getDirectors, updateDirector } from '../../api/directors';
import { getMembers } from '../../api/members';
import type { Director, DirectorPayload, PaginatedMembersResponse } from '../../api/types';
import { Button } from '@/components/ui/button';

type MemberOption = PaginatedMembersResponse['items'][number];

const DIRECTOR_POSITIONS = [
  'President',
  'Vice-President',
  'Executive Director',
  'Director',
  'Nominated Director',
  'Other',
];
const DIRECTOR_QUOTAS = ['General', 'Women', 'SC', 'ST', 'OBC', 'Other'];

const getDateValue = (value: string | null | undefined) => value?.slice(0, 10) ?? '';
const getTodayDateValue = () => new Date().toISOString().slice(0, 10);

const getLatestDirector = (directors: Director[]) => {
  if (directors.length === 0) {
    return null;
  }

  return [...directors].sort((left, right) => {
    const createdAtDiff = new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }
    return right.fromDate.localeCompare(left.fromDate);
  })[0];
};

const newDirectorValues = (previousDirector?: Director | null): DirectorPayload => ({
  memberId: '',
  position: 'Director',
  quota: 'General',
  term: previousDirector ? previousDirector.term : 1,
  fromDate: previousDirector ? getDateValue(previousDirector.fromDate) : getTodayDateValue(),
  toDate: previousDirector ? getDateValue(previousDirector.toDate) : '',
  remarks: '',
});

async function getAllMembers() {
  const firstPage = await getMembers({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const members = [...firstPage.data.items];

  for (let page = 2; page <= firstPage.data.totalPages; page += 1) {
    const response = await getMembers({ page, limit: 100, sortBy: 'name', sortOrder: 'asc' });
    members.push(...response.data.items);
  }

  return members;
}

function DirectorModal({
  director,
  members,
  allDirectors,
  saving,
  error,
  onClose,
  onSave,
}: {
  director: Director | null;
  members: MemberOption[];
  allDirectors: Director[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (payload: DirectorPayload) => void;
}) {
  const [form, setForm] = useState<DirectorPayload>(() =>
    director
      ? {
          memberId: director.memberId,
          position: director.position,
          quota: director.quota,
          term: director.term,
          fromDate: director.fromDate.slice(0, 10),
          toDate: director.toDate?.slice(0, 10) ?? '',
          remarks: director.remarks ?? '',
        }
      : newDirectorValues(getLatestDirector(allDirectors)),
  );
  const selectMember = (memberId: string) => {
    if (director) return;

    setForm(previous => ({ ...previous, memberId }));
  };

  const [validationError, setValidationError] = useState('');
  const [memberLookup, setMemberLookup] = useState('');
  const [isMemberOptionsOpen, setIsMemberOptionsOpen] = useState(false);
  const selectedMember = members.find(member => member.memberId === form.memberId);
  const matchingMembers = members.filter(member =>
    [member.memberId, member.memberCode, member.name, member.mobile ?? ''].some(value =>
      value.toLocaleLowerCase().includes(memberLookup.trim().toLocaleLowerCase()),
    ),
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.toDate && form.toDate < form.fromDate) {
      setValidationError('End date cannot be earlier than start date.');
      return;
    }
    if (!Number.isInteger(form.term) || form.term < 1) {
      setValidationError('Term must be a positive whole number.');
      return;
    }
    onSave(form);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='director-modal-title'
        className='w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl'
      >
        <header className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
          <h2 id='director-modal-title' className='text-lg font-semibold text-slate-900'>
            {director ? 'Edit director' : 'Add director'}
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
              aria-expanded={isMemberOptionsOpen}
              aria-controls='director-member-options'
              value={
                isMemberOptionsOpen
                  ? memberLookup
                  : selectedMember
                    ? `${selectedMember.name} (${selectedMember.memberCode}) · ID ${selectedMember.memberId}`
                    : ''
              }
              onFocus={() => {
                setMemberLookup('');
                setIsMemberOptionsOpen(true);
              }}
              onChange={event => {
                setMemberLookup(event.target.value);
                setIsMemberOptionsOpen(true);
                setForm(previous => ({ ...previous, memberId: '' }));
              }}
              onKeyDown={event => {
                if (event.key === 'Escape') setIsMemberOptionsOpen(false);
                if (event.key === 'Enter' && isMemberOptionsOpen && matchingMembers[0]) {
                  event.preventDefault();
                  const selected = matchingMembers[0];
                  setMemberLookup('');
                  setIsMemberOptionsOpen(false);
                }
              }}
              placeholder='Search by member name, code, or mobile...'
              className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
            />
            {isMemberOptionsOpen && (
              <div
                id='director-member-options'
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
                      selectMember(member.memberId);
                      setMemberLookup('');
                      setIsMemberOptionsOpen(false);
                      setValidationError('');
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
          <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem]'>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>Position *</span>
              <select
                required
                value={form.position}
                onChange={event =>
                  setForm(previous => ({ ...previous, position: event.target.value }))
                }
                className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              >
                <option value='' disabled>
                  Select position
                </option>
                {!DIRECTOR_POSITIONS.includes(form.position) && form.position && (
                  <option value={form.position}>{form.position}</option>
                )}
                {DIRECTOR_POSITIONS.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>Quota *</span>
              <select
                required
                value={form.quota}
                onChange={event =>
                  setForm(previous => ({ ...previous, quota: event.target.value }))
                }
                className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              >
                <option value='' disabled>
                  Select quota
                </option>
                {!DIRECTOR_QUOTAS.includes(form.quota) && form.quota && (
                  <option value={form.quota}>{form.quota}</option>
                )}
                {DIRECTOR_QUOTAS.map(quota => (
                  <option key={quota} value={quota}>
                    {quota}
                  </option>
                ))}
              </select>
            </label>
            <label className='grid min-w-0 gap-1.5 text-sm font-medium text-slate-700'>
              <span>Term *</span>
              <input
                required
                type='number'
                min='1'
                step='1'
                value={form.term}
                onChange={event =>
                  setForm(previous => ({ ...previous, term: Number(event.target.value) }))
                }
                className='h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>Start date *</span>
              <input
                required
                type='date'
                value={form.fromDate}
                onChange={event => {
                  setForm(previous => ({ ...previous, fromDate: event.target.value }));
                  setValidationError('');
                }}
                className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
            <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
              <span>End date</span>
              <input
                type='date'
                min={form.fromDate}
                value={form.toDate}
                onChange={event => {
                  setForm(previous => ({ ...previous, toDate: event.target.value }));
                  setValidationError('');
                }}
                className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
              />
            </label>
          </div>
          <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
            <span>Remarks</span>
            <textarea
              rows={3}
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
              {saving ? 'Saving...' : director ? 'Save changes' : 'Add director'}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Directors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [deleteDirectorTarget, setDeleteDirectorTarget] = useState<Director | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();
  const directorsQuery = useQuery({ queryKey: ['directors'], queryFn: getDirectors });
  const membersQuery = useQuery({ queryKey: ['director-member-options'], queryFn: getAllMembers });
  const directors = directorsQuery.data?.data.items ?? [];
  const members = membersQuery.data ?? [];
  const groupedDirectors = useMemo(() => {
    const groups = new Map<number, Director[]>();

    directors.forEach(director => {
      const group = groups.get(director.term) ?? [];
      group.push(director);
      groups.set(director.term, group);
    });

    return [...groups.entries()]
      .map(([term, records]) => ({
        term,
        records: [...records].sort((left, right) => {
          const leftPositionOrder = DIRECTOR_POSITIONS.indexOf(left.position);
          const rightPositionOrder = DIRECTOR_POSITIONS.indexOf(right.position);
          const leftOrder =
            leftPositionOrder === -1 ? DIRECTOR_POSITIONS.length : leftPositionOrder;
          const rightOrder =
            rightPositionOrder === -1 ? DIRECTOR_POSITIONS.length : rightPositionOrder;

          return leftOrder - rightOrder || right.fromDate.localeCompare(left.fromDate);
        }),
      }))
      .sort((left, right) => right.term - left.term);
  }, [directors]);
  const [openTerm, setOpenTerm] = useState<number | null>(null);

  useEffect(() => {
    if (!groupedDirectors.length) {
      setOpenTerm(null);
      return;
    }
    console.log(groupedDirectors);

    setOpenTerm(previous => previous ?? groupedDirectors[0].term);
  }, [groupedDirectors]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDirector(null);
    setFormError('');
  };

  const saveDirector = async (payload: DirectorPayload) => {
    setIsSaving(true);
    setFormError('');
    try {
      const response = editingDirector
        ? await updateDirector(editingDirector.id, payload)
        : await createDirector(payload);
      await queryClient.invalidateQueries({ queryKey: ['directors'] });
      closeModal();
      toast.success(response.message);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save director.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeDirector = async () => {
    if (!deleteDirectorTarget) return;
    try {
      const response = await deleteDirector(deleteDirectorTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['directors'] });
      setDeleteDirectorTarget(null);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete director.');
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <header className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Directors</h1>
            <p className='mt-1 text-sm text-slate-500'>Manage director terms linked to members.</p>
          </div>
          <Button
            type='button'
            onClick={() => {
              setEditingDirector(null);
              setFormError('');
              setIsModalOpen(true);
            }}
          >
            <Plus /> Add director
          </Button>
        </header>

        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            {directors.length} director records
          </div>
          {directorsQuery.isLoading || membersQuery.isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading directors...</p>
          ) : directorsQuery.error || membersQuery.error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {directorsQuery.error instanceof Error
                ? directorsQuery.error.message
                : membersQuery.error instanceof Error
                  ? membersQuery.error.message
                  : 'Unable to load director records.'}
            </p>
          ) : directors.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No director records found.</p>
          ) : (
            <div className='space-y-3 p-4'>
              {groupedDirectors.map(group => {
                const isOpen = openTerm === group.term;
                return (
                  <div
                    key={group.term}
                    className='overflow-hidden rounded-lg border border-slate-200'
                  >
                    <button
                      type='button'
                      onClick={() => setOpenTerm(isOpen ? null : group.term)}
                      aria-expanded={isOpen}
                      className='flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100'
                    >
                      <span>Term {group.term}</span>
                      <span className='rounded-full bg-white px-2 py-0.5 text-xs text-slate-600'>
                        {group.records.length} record{group.records.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className='border-t border-slate-200 bg-white'>
                        <div className='overflow-x-auto'>
                          <table className='min-w-full text-left text-sm'>
                            <thead className='bg-slate-50 text-slate-600'>
                              <tr className='border-b border-slate-200'>
                                <th className='px-4 py-3'>Member code</th>
                                <th className='px-4 py-3'>Director</th>
                                <th className='px-4 py-3'>Position</th>
                                <th className='px-4 py-3'>Quota</th>
                                <th className='px-4 py-3'>Start date</th>
                                <th className='px-4 py-3'>End date</th>
                                <th className='px-4 py-3'>Remarks</th>
                                <th className='px-4 py-3 text-right'>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.records.map(director => (
                                <tr
                                  key={director.id}
                                  className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                                >
                                  <td className='whitespace-nowrap px-4 py-3'>
                                    {director.member.memberCode}
                                  </td>
                                  <td className='px-4 py-3 font-medium'>{director.member.name}</td>
                                  <td className='px-4 py-3'>{director.position}</td>
                                  <td className='px-4 py-3'>{director.quota}</td>
                                  <td className='whitespace-nowrap px-4 py-3'>
                                    {director.fromDate.slice(0, 10)}
                                  </td>
                                  <td className='whitespace-nowrap px-4 py-3'>
                                    {director.toDate?.slice(0, 10) ?? 'Current'}
                                  </td>
                                  <td className='max-w-xs truncate px-4 py-3'>
                                    {director.remarks || '-'}
                                  </td>
                                  <td className='px-4 py-3'>
                                    <div className='flex justify-end gap-1'>
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='icon-sm'
                                        aria-label={`Edit director ${director.member.name}`}
                                        title='Edit director'
                                        onClick={() => {
                                          setEditingDirector(director);
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
                                        aria-label={`Delete director ${director.member.name}`}
                                        title='Delete director'
                                        onClick={() => setDeleteDirectorTarget(director)}
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
                      </div>
                    )}
                  </div>
                );
              })}
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
          <DirectorModal
            director={editingDirector}
            members={members}
            allDirectors={directors}
            saving={isSaving}
            error={formError}
            onClose={closeModal}
            onSave={saveDirector}
          />
        ))}

      {deleteDirectorTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-director-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-director-title' className='text-lg font-semibold text-slate-900'>
              Delete director record?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              Remove {deleteDirectorTarget.member.name} from this director term?
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => setDeleteDirectorTarget(null)}>
                Cancel
              </Button>
              <Button type='button' variant='destructive' onClick={removeDirector}>
                Delete
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
