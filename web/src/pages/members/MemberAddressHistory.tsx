import { useQuery } from '@tanstack/react-query';

import { getMemberAddressHistory } from '../../api/memberAddressHistory';
import type { MemberAddressHistory } from '../../api/types';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Current';
}

function addressLines(record: MemberAddressHistory) {
  return [
    record.addressLine1,
    record.addressLine2,
    record.city,
    record.district,
    record.postalCode,
  ].filter(Boolean);
}

export default function MemberAddressHistoryPage() {
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

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <header className='mb-5'>
          <h1 className='text-2xl font-semibold text-slate-900'>Member address history</h1>
          <p className='mt-1 text-sm text-slate-500'>Previous address records grouped by member.</p>
        </header>
        <section className='overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            {history.length} previous address records · {groupedHistory.size} members
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading address history...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Unable to load address history.'}
            </p>
          ) : groupedHistory.size === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No address changes have been recorded.</p>
          ) : (
            <div className='divide-y divide-slate-200'>
              {[...groupedHistory.values()].map(({ member, records }) => (
                <details key={member.memberId} className='group' open>
                  <summary className='flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-slate-50'>
                    <span className='font-semibold text-slate-900'>{member.name}</span>
                    {member.nameKannada && (
                      <span className='text-sm text-slate-600'>{member.nameKannada}</span>
                    )}
                    <span className='text-sm text-slate-500'>Member {member.memberCode}</span>
                    <span className='ml-auto text-sm text-slate-500'>
                      {records.length} {records.length === 1 ? 'change' : 'changes'}
                    </span>
                  </summary>
                  <div className='border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:pl-10'>
                    <div className='space-y-3'>
                      {records.map(record => (
                        <article
                          key={record.id}
                          className='grid gap-2 border-l-2 border-teal-700 pl-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start'
                        >
                          <div>
                            <p className='text-sm text-slate-900'>
                              {addressLines(record).join(', ') || 'No address details'}
                            </p>
                            {(record.addressLine1Kannada ||
                              record.addressLine2Kannada ||
                              record.cityKannada ||
                              record.districtKannada) && (
                              <p className='mt-1 text-sm text-slate-600'>
                                {[
                                  record.addressLine1Kannada,
                                  record.addressLine2Kannada,
                                  record.cityKannada,
                                  record.districtKannada,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                          <p className='text-xs text-slate-500 sm:text-right'>
                            {formatDate(record.fromDate)} to {formatDate(record.toDate)}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
