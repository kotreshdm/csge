import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { getLayouts } from '../../api/layouts';
import { getMembers } from '../../api/members';
import { assignSite, createSite, getSites, updateSite, updateSiteStatus } from '../../api/sites';
import { getTransactions } from '../../api/transactions';
import type { Layout, Site, SitePayload, Transaction } from '../../api/types';
import { Button } from '@/components/ui/button';

async function getAllMembers() {
  const firstResponse = await getMembers({ page: 1, limit: 100 });
  const members = [...firstResponse.data.items];
  for (let page = 2; page <= firstResponse.data.totalPages; page += 1) {
    const response = await getMembers({ page, limit: 100 });
    members.push(...response.data.items);
  }
  return members;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Sites() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [siteNo, setSiteNo] = useState('');
  const [layoutId, setLayoutId] = useState('');
  const [eastWest, setEastWest] = useState('');
  const [northSouth, setNorthSouth] = useState('');
  const [totalSqFeet, setTotalSqFeet] = useState('');
  const [totalPrice, setTotalPrice] = useState('0');
  const [registeredAmount, setRegisteredAmount] = useState('0');
  const [allottedMemberId, setAllottedMemberId] = useState('');
  const [allotmentDate, setAllotmentDate] = useState('');
  const [status, setStatus] = useState<Site['status']>('AVAILABLE');

  const sitesQuery = useQuery({ queryKey: ['sites'], queryFn: getSites });
  const layoutsQuery = useQuery({ queryKey: ['layouts'], queryFn: getLayouts });
  const membersQuery = useQuery({ queryKey: ['site-member-options'], queryFn: getAllMembers });
  const transactionsQuery = useQuery({ queryKey: ['site-allotment-transactions'], queryFn: getTransactions });
  const sites = useMemo(() => sitesQuery.data?.data.items ?? [], [sitesQuery.data]);
  const layouts = layoutsQuery.data?.data.items ?? [];
  const members = membersQuery.data ?? [];
  const paidMemberIds = useMemo(() => {
    const memberIds = new Set<string>();
    for (const transaction of transactionsQuery.data?.data.items ?? []) {
      if (
        transaction.type === 'CREDIT' &&
        transaction.layoutId === layoutId &&
        transaction.memberId &&
        Number(transaction.siteDepositAmount) > 0
      ) {
        memberIds.add(transaction.memberId);
      }
    }
    return memberIds;
  }, [layoutId, transactionsQuery.data]);
  const eligibleMembers = members.filter(
    member =>
      paidMemberIds.has(member.memberId) ||
      (editingSite?.layoutId === layoutId && member.memberId === editingSite.allottedMemberId),
  );
  const sitesByLayout = useMemo(() => {
    const grouped = new Map<string, Site[]>();
    for (const site of sites) {
      const layoutSites = grouped.get(site.layoutId) ?? [];
      layoutSites.push(site);
      grouped.set(site.layoutId, layoutSites);
    }
    return grouped;
  }, [sites]);

  const invalidateSites = async () => {
    await queryClient.invalidateQueries({ queryKey: ['sites'] });
  };
  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: SitePayload }) =>
      id ? updateSite(id, data) : createSite(data),
    onSuccess: async response => {
      await invalidateSites();
      setIsFormOpen(false);
      setEditingSite(null);
      toast.success(response.message || 'Site saved.');
    },
    onError: error => toast.error(errorMessage(error, 'Unable to save site.')),
  });
  const assignmentMutation = useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string | null }) =>
      assignSite(id, memberId),
    onSuccess: async response => {
      await invalidateSites();
      toast.success(response.message || 'Site assignment updated.');
    },
    onError: error => toast.error(errorMessage(error, 'Unable to update site assignment.')),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Site['status'] }) =>
      updateSiteStatus(id, status),
    onSuccess: async response => {
      await invalidateSites();
      toast.success(response.message || 'Site status updated.');
    },
    onError: error => toast.error(errorMessage(error, 'Unable to update site status.')),
  });

  const openCreateForm = (layout?: Layout) => {
    setEditingSite(null);
    setSiteNo('');
    setLayoutId(layout?.id ?? layouts[0]?.id ?? '');
    setEastWest('');
    setNorthSouth('');
    setTotalSqFeet('');
    setTotalPrice('0');
    setRegisteredAmount('0');
    setAllottedMemberId('');
    setAllotmentDate('');
    setStatus('AVAILABLE');
    setIsFormOpen(true);
  };

  const openEditForm = (site: Site) => {
    setEditingSite(site);
    setSiteNo(site.siteNo);
    setLayoutId(site.layoutId);
    setEastWest(site.eastWest);
    setNorthSouth(site.northSouth);
    setTotalSqFeet(site.totalSqFeet);
    setTotalPrice(site.totalPrice);
    setRegisteredAmount(site.registeredAmount);
    setAllottedMemberId(site.allottedMemberId ?? '');
    setAllotmentDate(site.allotmentDate ?? '');
    setStatus(site.status);
    setIsFormOpen(true);
  };

  const saveSite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate({
      id: editingSite?.id ?? null,
      data: {
        siteNo: siteNo.trim(),
        layoutId,
        eastWest,
        northSouth,
        totalSqFeet,
        totalPrice,
        registeredAmount,
        allottedMemberId: allottedMemberId || null,
        allotmentDate: allotmentDate || null,
        status,
      },
    });
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <header className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Sites</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Manage site availability and member allotments by layout.
            </p>
          </div>
          <Button onClick={() => openCreateForm()} disabled={layouts.length === 0}>
            <Plus /> Add site
          </Button>
        </header>

        {sitesQuery.isLoading || layoutsQuery.isLoading ? (
          <p className='py-6 text-sm text-slate-500'>Loading sites...</p>
        ) : sitesQuery.isError || layoutsQuery.isError ? (
          <p role='alert' className='py-4 text-sm text-rose-700'>
            Unable to load sites or layouts.
          </p>
        ) : layouts.length === 0 ? (
          <p className='border-t border-slate-200 py-6 text-sm text-slate-500'>
            Create a layout before adding sites.
          </p>
        ) : (
          <div className='space-y-7'>
            {layouts.map(layout => {
              const layoutSites = sitesByLayout.get(layout.id) ?? [];
              return (
                <section key={layout.id} className='border-t border-slate-200 pt-4'>
                  <header className='mb-3 flex flex-wrap items-center gap-3'>
                    <div className='mr-auto'>
                      <h2 className='font-semibold text-slate-900'>
                        {layout.layoutCode} · {layout.name}
                      </h2>
                      <p className='text-sm text-slate-500'>{layoutSites.length} sites</p>
                    </div>
                    <Button variant='outline' size='sm' onClick={() => openCreateForm(layout)}>
                      <Plus /> Add site
                    </Button>
                  </header>
                  {layoutSites.length === 0 ? (
                    <p className='py-3 text-sm text-slate-500'>No sites in this layout.</p>
                  ) : (
                    <div className='overflow-x-auto border-y border-slate-200 bg-white'>
                      <table className='min-w-full text-left text-sm'>
                        <thead className='bg-slate-100 text-slate-600'>
                          <tr>
                            <th className='px-4 py-3'>Site No</th>
                            <th className='px-4 py-3'>Status</th>
                            <th className='px-4 py-3'>Allotted Member</th>
                            <th className='px-4 py-3 text-right'>Edit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {layoutSites.map(site => (
                            <tr key={site.id} className='border-t border-slate-100'>
                              <td className='whitespace-nowrap px-4 py-3 font-medium text-slate-900'>
                                {site.siteNo}
                              </td>
                              <td className='px-4 py-3'>
                                <span
                                  className={`inline-flex rounded-sm px-2 py-1 text-xs font-semibold ${
                                    site.status === 'AVAILABLE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-sky-100 text-sky-800'
                                  }`}
                                >
                                  {site.status}
                                </span>
                              </td>
                              <td className='px-4 py-3 text-slate-700'>
                                {site.allottedMember
                                  ? `${site.allottedMember.memberCode} · ${site.allottedMember.name}`
                                  : 'Not allotted'}
                              </td>
                              <td className='px-4 py-3 text-right'>
                                <Button
                                  variant='ghost'
                                  size='icon-sm'
                                  aria-label={`Edit site ${site.siteNo}`}
                                  title='Edit site'
                                  onClick={() => openEditForm(site)}
                                >
                                  <Pencil />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      {isFormOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='dialog'
            aria-modal='true'
            aria-labelledby='site-form-heading'
            className='w-full max-w-lg border border-slate-200 bg-white p-5 shadow-xl'
          >
            <h2 id='site-form-heading' className='text-lg font-semibold text-slate-900'>
              {editingSite ? 'Edit site' : 'Add site'}
            </h2>
            <form className='mt-4 space-y-4' onSubmit={saveSite}>
              <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                <span>Layout</span>
                <select
                  required
                  value={layoutId}
                  onChange={event => {
                    setLayoutId(event.target.value);
                    if (!paidMemberIds.has(allottedMemberId)) {
                      setAllottedMemberId('');
                      setStatus('AVAILABLE');
                      setAllotmentDate('');
                    }
                  }}
                  className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                >
                  {layouts.map(layout => (
                    <option key={layout.id} value={layout.id}>
                      {layout.layoutCode} · {layout.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                <span>Site No</span>
                <input
                  required
                  autoFocus
                  value={siteNo}
                  onChange={event => setSiteNo(event.target.value)}
                  className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                />
              </label>
              <div className='grid gap-4 sm:grid-cols-2'>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>East-west</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    required
                    value={eastWest}
                    onChange={event => setEastWest(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>North-south</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    required
                    value={northSouth}
                    onChange={event => setNorthSouth(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Total square feet</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    required
                    value={totalSqFeet}
                    onChange={event => setTotalSqFeet(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Total price</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={totalPrice}
                    onChange={event => setTotalPrice(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Registered amount</span>
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={registeredAmount}
                    onChange={event => setRegisteredAmount(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Allotment date</span>
                  <input
                    type='date'
                    value={allotmentDate}
                    onChange={event => setAllotmentDate(event.target.value)}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  />
                </label>
              </div>
              <div className='grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2'>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Allotted member</span>
                  <select
                    value={allottedMemberId}
                    disabled={membersQuery.isLoading || transactionsQuery.isLoading}
                    onChange={event => {
                      const nextMemberId = event.target.value;
                      setAllottedMemberId(nextMemberId);
                      if (nextMemberId) setStatus('ALLOTTED');
                      else {
                        setStatus('AVAILABLE');
                        setAllotmentDate('');
                      }
                    }}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  >
                    <option value=''>Not allotted</option>
                    {eligibleMembers.map(member => (
                      <option key={member.memberId} value={member.memberId}>
                        {member.memberCode} · {member.name}
                      </option>
                    ))}
                  </select>
                  {!transactionsQuery.isLoading && eligibleMembers.length === 0 ? (
                    <span className='text-xs font-normal text-slate-500'>
                      No members have paid a site deposit for this layout.
                    </span>
                  ) : null}
                </label>
                <label className='grid gap-1.5 text-sm font-medium text-slate-700'>
                  <span>Site status</span>
                  <select
                    value={status}
                    onChange={event => {
                      const nextStatus = event.target.value as Site['status'];
                      setStatus(nextStatus);
                      if (nextStatus === 'AVAILABLE') {
                        setAllottedMemberId('');
                        setAllotmentDate('');
                      }
                    }}
                    className='h-10 rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900'
                  >
                    <option value='AVAILABLE'>AVAILABLE</option>
                    <option value='TEMP_ALLOTTED' disabled={!allottedMemberId}>TEMP_ALLOTTED</option>
                    <option value='ALLOTTED' disabled={!allottedMemberId}>ALLOTTED</option>
                    <option value='REGISTERED' disabled={!allottedMemberId}>REGISTERED</option>
                    <option value='SETTLED' disabled={!allottedMemberId}>SETTLED</option>
                  </select>
                </label>
              </div>
              <div className='flex justify-end gap-2 border-t border-slate-200 pt-4'>
                <Button type='button' variant='outline' onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit' disabled={saveMutation.isPending || !layoutId}>
                  {saveMutation.isPending
                    ? 'Saving...'
                    : editingSite
                      ? 'Save changes'
                      : 'Create site'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
