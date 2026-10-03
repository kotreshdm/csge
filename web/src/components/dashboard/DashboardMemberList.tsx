import { useState } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardMemberSummary } from '../../api/types';
import { MemberTransactionsModal } from './MemberTransactionsModal';
import { formatDashboardCurrency } from './dashboardFormatting';

export function DashboardMemberList({
  members,
  financialYear,
}: {
  members: DashboardMemberSummary[];
  financialYear: string;
}) {
  const [selectedMember, setSelectedMember] = useState<DashboardMemberSummary | null>(null);
  return (
    <>
      <section aria-labelledby='member-list-heading'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <h2 id='member-list-heading' className='text-lg font-semibold text-slate-900'>
            Member List
          </h2>
          <span className='text-xs text-slate-500'>First {members.length} active members</span>
        </div>
        <Card>
          <CardContent className='p-0'>
            {members.length ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full text-left text-sm'>
                  <thead className='bg-slate-50 text-xs uppercase text-slate-500'>
                    <tr>
                      <th className='px-4 py-3'>Code</th>
                      <th className='px-4 py-3'>Member</th>
                      <th className='px-4 py-3'>Type</th>
                      <th className='px-4 py-3 text-right'>Share</th>
                      <th className='px-4 py-3 text-right'>Site deposit</th>
                      <th className='px-4 py-3 text-right'>Action</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {members.map(member => (
                      <tr key={member.memberId}>
                        <td className='px-4 py-3 text-slate-500'>{member.memberCode}</td>
                        <td className='px-4 py-3 font-medium text-slate-800'>{member.name}</td>
                        <td className='px-4 py-3 text-slate-600'>{member.memberType}</td>
                        <td className='px-4 py-3 text-right'>
                          {formatDashboardCurrency(member.shareBalance)}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {formatDashboardCurrency(member.siteDepositBalance)}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setSelectedMember(member)}
                          >
                            <Eye className='h-4 w-4' /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='p-4 text-sm text-slate-500'>No active members found.</p>
            )}
          </CardContent>
        </Card>
      </section>
      <MemberTransactionsModal
        member={selectedMember}
        financialYear={financialYear}
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}
