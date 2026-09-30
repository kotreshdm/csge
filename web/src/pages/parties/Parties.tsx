import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { deleteParty, getParties } from '../../api/parties';
import type { Party } from '../../api/types';
import { PageToolbar } from '../../components/PageToolbar';
import { SortHeader } from '../../components/SortHeader';
import { Button } from '@/components/ui/button';
import { PARTY_TYPES } from '../../const/common';
import { ROUTES } from '../../const/routs';
import { highlightText } from '../members/helpers';
import type { PartySortField, SortOrder } from './types';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : '-';
}

function partyMatchesSearch(party: Party, search: string) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const searchableValues = [
    party.name,
    party.partyType,
    party.mobile,
    party.address,
    party.details,
  ];

  return searchableValues.some(value => value?.toLocaleLowerCase().includes(normalizedSearch));
}

export default function Parties() {
  const [search, setSearch] = useState('');
  const [partyType, setPartyType] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<PartySortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [partyToDelete, setPartyToDelete] = useState<Party | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['parties'],
    queryFn: getParties,
    staleTime: 30_000,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteParty,
    onSuccess: async response => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parties'] }),
        queryClient.invalidateQueries({ queryKey: ['partyTypes'] }),
      ]);
      setPartyToDelete(null);
      toast.success(response.message || 'Party deleted successfully.');
    },
    onError: mutationError => {
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Unable to delete party.',
      );
    },
  });

  const parties = data?.data.items ?? [];
  const partyTypes = useMemo(() => {
    const types: string[] = [...PARTY_TYPES];

    for (const party of parties) {
      if (!types.some(type => type.toLocaleLowerCase() === party.partyType.toLocaleLowerCase())) {
        types.push(party.partyType);
      }
    }

    return types.sort((a, b) => a.localeCompare(b));
  }, [parties]);
  const filteredParties = parties
    .filter(
      party =>
        (!partyType || party.partyType === partyType) &&
        (statusFilter === 'all' || party.status.toLocaleLowerCase() === statusFilter) &&
        (!search.trim() || partyMatchesSearch(party, search)),
    )
    .sort((first, second) => {
      const comparison =
        sortBy === 'startDate'
          ? new Date(first.startDate).getTime() - new Date(second.startDate).getTime()
          : first[sortBy].localeCompare(second[sortBy]);

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: PartySortField) => {
    if (sortBy === field) {
      setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(field);
    setSortOrder('asc');
  };

  const resetFilters = () => {
    setSearch('');
    setPartyType('');
    setStatusFilter('all');
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <PageToolbar
          title='Parties'
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder='Search parties, contact, address...'
          secondaryActionLabel='Reset'
          secondaryActionVariant='outline'
          onSecondaryAction={resetFilters}
          primaryActionLabel='Add Party'
          primaryActionPath={ROUTES.ADMIN.PARTIES_ADD}
        >
          <div
            className='flex items-center gap-1 rounded-md border border-slate-200 p-1'
            role='group'
            aria-label='Filter parties by status'
          >
            {(['all', 'active', 'inactive'] as const).map(status => (
              <Button
                key={status}
                type='button'
                size='sm'
                variant={statusFilter === status ? 'default' : 'ghost'}
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className='capitalize'
              >
                {status}
              </Button>
            ))}
          </div>
          <select
            value={partyType}
            onChange={event => setPartyType(event.target.value)}
            aria-label='Filter by party type'
            className='rounded-md border border-slate-200 px-3 py-2 text-sm'
          >
            <option value=''>All party types</option>
            {partyTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </PageToolbar>

        <div className='mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            Showing {filteredParties.length} of {parties.length} parties
          </div>

          {isLoading ? (
            <div className='p-6 text-sm text-slate-500'>Loading parties...</div>
          ) : error ? (
            <div role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Failed to load parties.'}
            </div>
          ) : filteredParties.length === 0 ? (
            <div className='p-6 text-sm text-slate-500'>
              {parties.length ? 'No parties match these filters.' : 'No parties found.'}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50'>
                  <tr className='border-b border-slate-200 text-slate-600'>
                    <th className='w-14 px-4 py-3'>#</th>
                    <th
                      aria-sort={
                        sortBy === 'name'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='whitespace-nowrap px-4 py-3'
                    >
                      <SortHeader
                        label='Party'
                        field='name'
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th
                      aria-sort={
                        sortBy === 'partyType'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='whitespace-nowrap px-4 py-3'
                    >
                      <SortHeader
                        label='Type'
                        field='partyType'
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3'>Mobile</th>
                    <th className='px-4 py-3'>Address</th>
                    <th className='px-4 py-3'>Details</th>
                    <th
                      aria-sort={
                        sortBy === 'startDate'
                          ? sortOrder === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className='whitespace-nowrap px-4 py-3'
                    >
                      <SortHeader
                        label='Start date'
                        field='startDate'
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className='whitespace-nowrap px-4 py-3'>End date</th>
                    <th className='whitespace-nowrap px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParties.map((party, index) => (
                    <tr
                      key={party.id}
                      className='border-b border-slate-200 last:border-0 odd:bg-slate-50 even:bg-slate-100 hover:bg-slate-200'
                    >
                      <td className='px-4 py-3 text-slate-500'>{index + 1}</td>
                      <td className='px-4 py-3 font-medium text-slate-900'>
                        {highlightText(party.name, search)}
                      </td>
                      <td className='px-4 py-3'>{highlightText(party.partyType, search)}</td>
                      <td className='px-4 py-3 capitalize'>{party.status}</td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {party.mobile ? highlightText(party.mobile, search) : '-'}
                      </td>
                      <td className='max-w-xs px-4 py-3 text-slate-600'>
                        {party.address ? highlightText(party.address, search) : '-'}
                      </td>
                      <td className='max-w-sm px-4 py-3 text-slate-600'>
                        {party.details ? highlightText(party.details, search) : '-'}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>{formatDate(party.startDate)}</td>
                      <td className='whitespace-nowrap px-4 py-3'>{formatDate(party.endDate)}</td>
                      <td className='whitespace-nowrap px-4 py-3 text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            render={<Link to={ROUTES.ADMIN.PARTIES_EDIT(party.id)} />}
                            aria-label={`Edit ${party.name}`}
                            title='Edit party'
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete ${party.name}`}
                            title='Delete party'
                            disabled={deleteMutation.isPending}
                            onClick={() => setPartyToDelete(party)}
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
        </div>
      </div>

      {partyToDelete && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'
          onMouseDown={event => {
            if (event.target === event.currentTarget && !deleteMutation.isPending) {
              setPartyToDelete(null);
            }
          }}
        >
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-party-title'
            aria-describedby='delete-party-description'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <div className='flex items-start gap-4'>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700'>
                <Trash2 className='size-5' aria-hidden='true' />
              </span>
              <div>
                <h2 id='delete-party-title' className='text-lg font-semibold text-slate-900'>
                  Delete party?
                </h2>
                <p id='delete-party-description' className='mt-2 text-sm text-slate-600'>
                  Delete <span className='font-medium text-slate-900'>{partyToDelete.name}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-2'>
              <Button
                variant='outline'
                disabled={deleteMutation.isPending}
                onClick={() => setPartyToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(partyToDelete.id)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete party'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
