import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ROUTES } from '../../const/routs';
import { pageSizes } from '../../const/common';
import { Button } from '@/components/ui/button';
import { getMembers } from '../../api/members';
import { memberGenderOptions, memberStatusOptions, memberTypeOptions } from './filterOptions';
import { highlightText } from './helpers';

import { SortHeader } from './SortHeader';
import type { SortField, SortOrder } from './types';
import { PageToolbar } from '../../components/PageToolbar';

export default function Members() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [memberType, setMemberType] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [showKannada, setShowKannada] = useState(false);

  const [sortBy, setSortBy] = useState<SortField>('memberCode');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filters = useMemo(
    () => ({
      page,
      limit,
      search,
      memberType,
      status,
      gender,
      sortBy,
      sortOrder,
    }),
    [page, limit, search, memberType, status, gender, sortBy, sortOrder],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['members', filters],
    queryFn: () => getMembers(filters),
    staleTime: 30_000,
    placeholderData: previousData => previousData,
  });

  const members = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  if (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to load members.');
  }

  const resetFilters = () => {
    setPage(1);
    setLimit(20);
    setSearch('');
    setMemberType('');
    setStatus('');
    setGender('');
  };
  const handleSort = (field: SortField) => {
    setPage(1);

    if (sortBy === field) {
      setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <PageToolbar
          title='Members'
          searchValue={search}
          onSearchChange={value => {
            setPage(1);
            setSearch(value);
          }}
          searchPlaceholder='Search member, receipt, mobile, address...'
          secondaryActionLabel='Reset'
          secondaryActionVariant='outline'
          onSecondaryAction={resetFilters}
          primaryActionLabel='Add Member'
          primaryActionPath={ROUTES.ADMIN.MEMBERS_ADD}
          showLanguageToggle
          languageLabel='ಕನ್ನಡ'
          languageValue={showKannada}
          onToggleLanguage={() => setShowKannada(value => !value)}
        >
          <select
            value={memberType}
            onChange={event => {
              setPage(1);
              setMemberType(event.target.value);
            }}
            className='rounded-md border border-slate-200 px-3 py-2 text-sm'
          >
            {memberTypeOptions.map(option => (
              <option key={option.value || 'all-types'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={event => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className='rounded-md border border-slate-200 px-3 py-2 text-sm'
          >
            {memberStatusOptions.map(option => (
              <option key={option.value || 'all-status'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={gender}
            onChange={event => {
              setPage(1);
              setGender(event.target.value);
            }}
            className='rounded-md border border-slate-200 px-3 py-2 text-sm'
          >
            {memberGenderOptions.map(option => (
              <option key={option.value || 'all-gender'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </PageToolbar>

        {/* Table */}
        <div className='mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white'>
          {isLoading ? (
            <div className='p-6 text-sm text-slate-500'>Loading members...</div>
          ) : members.length === 0 ? (
            <div className='p-6 text-sm text-slate-500'>No members found.</div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50'>
                  <tr className='border-b border-slate-200 text-slate-600'>
                    <th className='w-14 px-4 py-3'>#</th>

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='LF'
                        field='memberCode'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Receipt'
                        field='recieptNo'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Join Date'
                        field='joinDate'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Status'
                        field='status'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Member'
                        field='name'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className='px-4 py-3'>Father Name</th>

                    <th className='px-4 py-3'>Mobile</th>

                    <th className='px-4 py-3'>Address</th>
                    <th className='px-4 py-3'>Dist</th>
                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Pincode'
                        field='postalCode'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>
                    <th className='px-4 py-3 text-right'>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member, index) => {
                    const serialNumber = (page - 1) * limit + index + 1;

                    const address = showKannada
                      ? [member.addressLine1Kannada, member.addressLine2Kannada, member.cityKannada]
                          .filter(Boolean)
                          .join(', ')
                      : [member.addressLine1, member.addressLine2, member.city]
                          .filter(Boolean)
                          .join(', ');

                    const name = showKannada ? member.nameKannada || member.name : member.name;
                    const fatherName = showKannada
                      ? member.careOfNameKannada || member.careOfName
                      : member.careOfName;
                    const district = showKannada
                      ? member.districtKannada || member.district
                      : member.district;

                    const statusColor =
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : member.status === 'INACTIVE'
                          ? 'bg-amber-100 text-amber-700'
                          : member.status === 'RESIGNED'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-rose-100 text-rose-700';

                    return (
                      <tr
                        key={member.memberId}
                        className='border-b border-slate-200 last:border-0  odd:bg-slate-50  even:bg-slate-200 hover:bg-slate-300'
                      >
                        {/* SL NO */}
                        <td className='px-4 py-3 text-slate-500'>{serialNumber}</td>
                        {/* MEMBER */}
                        <td className='px-4 py-3'>
                          <div className='mt-0.5 text-sm text-slate-500'>
                            {highlightText(member.memberCode, search)}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='mt-0.5 text-sm text-slate-500'>
                            {highlightText(member.recieptNo, search)}
                          </div>
                        </td>
                        {/* JOIN DATE */}
                        <td className='whitespace-nowrap px-4 py-3'>
                          {member.joinDate
                            ? new Date(member.joinDate).toLocaleDateString('en-GB')
                            : '-'}
                        </td>
                        {/* STATUS */}
                        <td className='px-4 py-3'>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}
                          >
                            {member.status || 'N/A'}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='font-medium text-slate-900'>
                            {highlightText(name, search)}
                          </div>
                        </td>
                        <td>
                          <div className='font-medium text-slate-900'>{fatherName}</div>
                        </td>
                        {/* MOBILE */}
                        <td className='px-4 py-3'>
                          {member.mobile ? highlightText(member.mobile, search) : '-'}
                        </td>
                        {/* ADDRESS */}
                        <td className='max-w-md px-4 py-3 text-slate-600'>
                          {address ? highlightText(address, search) : '-'}
                        </td>
                        <td className='max-w-md px-4 py-3 text-slate-600'>
                          {district ? highlightText(district, search) : '-'}
                        </td>
                        <td className='max-w-md px-4 py-3 text-slate-600'>
                          {member.postalCode ? highlightText(member.postalCode, search) : '-'}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <Link
                            to={ROUTES.ADMIN.MEMBERS_EDIT(member.memberId)}
                            state={{ member }}
                            className='inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100'
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between border-t border-slate-200 px-4 py-3'>
              <select
                value={limit}
                onChange={event => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                className='rounded-md border border-slate-200 px-3 py-2 text-sm'
              >
                {pageSizes.map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className='text-sm text-slate-500'>
                Page {page} of {totalPages}
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 1}
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                >
                  Previous
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  disabled={page >= totalPages}
                  onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
