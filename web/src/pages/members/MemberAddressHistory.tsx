import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';

import { getMemberAddressHistory } from '../../api/memberAddressHistory';
import type { MemberAddressHistory } from '../../api/types';
import { highlightText } from './helpers';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Current';
}

type AddressFieldsSource = Pick<
  MemberAddressHistory,
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'district'
  | 'postalCode'
  | 'addressLine1Kannada'
  | 'addressLine2Kannada'
  | 'cityKannada'
  | 'districtKannada'
>;

type AddressFieldKey = keyof AddressFieldsSource;

function AddressLine({
  address,
  comparedWith,
  fields,
}: {
  address: AddressFieldsSource;
  comparedWith?: AddressFieldsSource;
  fields: readonly AddressFieldKey[];
}) {
  const visibleFields = fields.filter(field => address[field]);

  return (
    <>
      {visibleFields.map((field, index) => {
        const value = address[field];
        const changed = comparedWith && (value ?? '') !== (comparedWith[field] ?? '');

        return (
          <span key={field}>
            {index > 0 ? ', ' : null}
            {changed ? (
              <mark className='rounded-sm bg-amber-200 px-0.5 text-amber-950'>{value}</mark>
            ) : (
              value
            )}
          </span>
        );
      })}
    </>
  );
}

function AddressVersion({
  address,
  comparedWith,
}: {
  address: AddressFieldsSource;
  comparedWith?: AddressFieldsSource;
}) {
  const englishFields: readonly AddressFieldKey[] = [
    'addressLine1',
    'addressLine2',
    'city',
    'district',
    'postalCode',
  ];
  const kannadaFields: readonly AddressFieldKey[] = [
    'addressLine1Kannada',
    'addressLine2Kannada',
    'cityKannada',
    'districtKannada',
  ];
  const hasEnglishAddress = englishFields.some(field => address[field]);
  const hasKannadaAddress = kannadaFields.some(field => address[field]);

  if (!hasEnglishAddress && !hasKannadaAddress) {
    return <p className='text-sm text-slate-500'>No address details</p>;
  }

  return (
    <div className='space-y-1 text-sm'>
      {hasEnglishAddress && (
        <p className='break-words text-slate-900'>
          <span className='mr-1 text-xs font-medium text-slate-500'>EN</span>
          <AddressLine address={address} comparedWith={comparedWith} fields={englishFields} />
        </p>
      )}
      {hasKannadaAddress && (
        <p className='break-words text-slate-700'>
          <span className='mr-1 text-xs font-medium text-slate-500'>ಕನ್ನಡ</span>
          <AddressLine address={address} comparedWith={comparedWith} fields={kannadaFields} />
        </p>
      )}
    </div>
  );
}

export default function MemberAddressHistoryPage() {
  const [search, setSearch] = useState('');
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-address-history'],
    queryFn: getMemberAddressHistory,
  });
  const history = data?.data.items ?? [];
  const groupedHistory = new Map<
    string,
    { member: MemberAddressHistory['member']; records: MemberAddressHistory[] }
  >();

  for (const record of history) {
    const existingGroup = groupedHistory.get(record.memberId);
    if (existingGroup) {
      existingGroup.records.push(record);
    } else {
      groupedHistory.set(record.memberId, { member: record.member, records: [record] });
    }
  }
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredGroups = [...groupedHistory.values()].filter(({ member }) =>
    [member.name, member.nameKannada ?? '', member.memberCode].some(value =>
      value.toLocaleLowerCase().includes(normalizedSearch),
    ),
  );
  const visibleRecordCount = filteredGroups.reduce(
    (total, group) => total + group.records.length,
    0,
  );
  const displayedOpenMemberId =
    normalizedSearch && filteredGroups.length === 1
      ? filteredGroups[0].member.memberId
      : openMemberId;

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <header className='mb-5 flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Member address history</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Previous address records grouped by member.
            </p>
          </div>
          <input
            type='search'
            aria-label='Search members by name or member code'
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search member name or code...'
            className='h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm sm:w-72'
          />
        </header>
        <section className='overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            {visibleRecordCount} previous address records · {filteredGroups.length} members
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading address history...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Unable to load address history.'}
            </p>
          ) : history.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No address changes have been recorded.</p>
          ) : filteredGroups.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No members match this search.</p>
          ) : (
            <div className='divide-y divide-slate-200'>
              {filteredGroups.map(({ member, records }) => (
                <div key={member.memberId}>
                  <button
                    type='button'
                    aria-expanded={displayedOpenMemberId === member.memberId}
                    aria-controls={`member-address-history-${member.memberId}`}
                    onClick={() =>
                      setOpenMemberId(
                        displayedOpenMemberId === member.memberId ? null : member.memberId,
                      )
                    }
                    className='flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700'
                  >
                    <ChevronDown
                      aria-hidden='true'
                      className={`size-4 shrink-0 text-slate-500 transition-transform ${displayedOpenMemberId === member.memberId ? 'rotate-180' : ''}`}
                    />
                    <span className='font-semibold text-slate-900'>
                      {highlightText(member.name, search)}
                    </span>
                    {member.nameKannada && (
                      <span className='text-sm text-slate-600'>
                        {highlightText(member.nameKannada, search)}
                      </span>
                    )}
                    <span className='text-sm text-slate-500'>
                      Member {highlightText(member.memberCode, search)}
                    </span>
                    <span className='ml-auto text-sm text-slate-500'>
                      {records.length} {records.length === 1 ? 'change' : 'changes'}
                    </span>
                  </button>
                  <div
                    id={`member-address-history-${member.memberId}`}
                    role='region'
                    aria-label={`Address history for ${member.name}`}
                    hidden={displayedOpenMemberId !== member.memberId}
                    className='border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:pl-10'
                  >
                    <div className='space-y-3'>
                      {records.map((record, index) => {
                        const newerVersion = index === 0 ? member : records[index - 1];
                        const versionColor =
                          index % 3 === 0
                            ? 'border-teal-700'
                            : index % 3 === 1
                              ? 'border-sky-700'
                              : 'border-violet-700';

                        return (
                          <article
                            key={record.id}
                            className={`grid gap-2 border-l-2 ${versionColor} pl-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start`}
                          >
                            <div>
                              <p className='mb-1 text-xs font-semibold uppercase text-slate-500'>
                                Previous address version {records.length - index}
                              </p>
                              <AddressVersion address={record} comparedWith={newerVersion} />
                            </div>
                            <div className='text-xs text-slate-500 sm:text-right'>
                              <p>
                                {formatDate(record.fromDate)} to {formatDate(record.toDate)}
                              </p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
