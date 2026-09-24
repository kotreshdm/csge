import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ROUTES } from '../../const/routs';
import { Button } from '@/components/ui/button';
import { getMembers } from '../../api/members';

const pageSizes = [20, 50, 100];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightText = (text: string | null | undefined, query: string) => {
  const value = String(text ?? '');
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return value;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
  const parts = value.split(pattern);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

    return isMatch ? (
      <mark key={`${part}-${index}`} className='rounded bg-yellow-200 px-0.5 text-yellow-900'>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
};

type SortField = 'memberCode' | 'recieptNo' | 'joinDate' | 'name' | 'status' | 'mobile';

type SortOrder = 'asc' | 'desc';

interface SortHeaderProps {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortHeader({ label, field, sortBy, sortOrder, onSort }: SortHeaderProps) {
  const active = sortBy === field;

  return (
    <button
      type='button'
      onClick={() => onSort(field)}
      className='inline-flex items-center gap-1 font-medium hover:text-slate-900'
    >
      {label}

      <span className='text-xs text-slate-400'>
        {active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </button>
  );
}

export default function Members() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [memberType, setMemberType] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [showKannada, setShowKannada] = useState(false);

  const [sortBy, setSortBy] = useState('memberCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
        {/* Header */}
        <div className='flex flex-wrap items-center gap-3'>
          <h1 className='mr-auto text-2xl font-semibold text-slate-900'>Members</h1>

          <input
            value={search}
            onChange={event => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder='Search member, receipt, mobile, address...'
            className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-80'
          />

          {/* Kannada / English */}
          <Button
            variant={showKannada ? 'default' : 'outline'}
            onClick={() => setShowKannada(value => !value)}
          >
            {showKannada ? 'English' : 'ಕನ್ನಡ'}
          </Button>

          <Button variant='outline' onClick={resetFilters}>
            Reset
          </Button>

          <Button asChild>
            <Link to={ROUTES.ADMIN.MEMBERS_ADD}>Add Member</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className='mt-5 rounded-xl border border-slate-200 bg-white p-4'>
          <div className='flex flex-wrap gap-3'>
            <select
              value={memberType}
              onChange={event => {
                setPage(1);
                setMemberType(event.target.value);
              }}
              className='rounded-md border border-slate-200 px-3 py-2 text-sm'
            >
              <option value=''>All types</option>
              <option value='MEMBER'>Member</option>
              <option value='ASSOCIATE'>Associate</option>
              <option value='SUPERUSER'>Superuser</option>
            </select>

            <select
              value={status}
              onChange={event => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className='rounded-md border border-slate-200 px-3 py-2 text-sm'
            >
              <option value=''>All status</option>
              <option value='ACTIVE'>Active</option>
              <option value='INACTIVE'>Inactive</option>
              <option value='INCORRECT'>Incorrect</option>
              <option value='RESIGNED'>Resigned</option>
              <option value='DECEASED'>Deceased</option>
            </select>

            <select
              value={gender}
              onChange={event => {
                setPage(1);
                setGender(event.target.value);
              }}
              className='rounded-md border border-slate-200 px-3 py-2 text-sm'
            >
              <option value=''>All gender</option>
              <option value='MALE'>Male</option>
              <option value='FEMALE'>Female</option>
              <option value='OTHER'>Other</option>
            </select>

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
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

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

                    <th className='px-4 py-3'>
                      <SortHeader
                        label='Mobile'
                        field='mobile'
                        sortBy={sortBy as SortField}
                        sortOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </th>

                    <th className='px-4 py-3'>Address</th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member, index) => {
                    const serialNumber = (page - 1) * limit + index + 1;

                    const address = showKannada
                      ? [
                          member.addressLine1Kannada,
                          member.addressLine2Kannada,
                          member.cityKannada,
                          member.districtKannada,
                          member.postalCode ? `- ${member.postalCode}` : null,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : [
                          member.addressLine1,
                          member.addressLine2,
                          member.city,
                          member.district,
                          member.postalCode ? `- ${member.postalCode}` : null,
                        ]
                          .filter(Boolean)
                          .join(', ');

                    const name = showKannada ? member.nameKannada || member.name : member.name;

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
                        className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                      >
                        {/* SL NO */}
                        <td className='px-4 py-3 text-slate-500'>{serialNumber}</td>
                        {/* MEMBER */}
                        <td className='px-4 py-3'>
                          <div className='mt-0.5 text-xs text-slate-500'>
                            {highlightText(member.memberCode, search)}
                          </div>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='mt-0.5 text-xs text-slate-500'>
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
                        {/* MOBILE */}
                        <td className='px-4 py-3'>
                          {member.mobile ? highlightText(member.mobile, search) : '-'}
                        </td>
                        {/* ADDRESS */}
                        <td className='max-w-md px-4 py-3 text-slate-600'>
                          {address ? highlightText(address, search) : '-'}
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
