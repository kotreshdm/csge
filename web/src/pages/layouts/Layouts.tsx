import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteLayout, getLayouts } from '../../api/layouts';
import type { Layout } from '../../api/types';
import { Button } from '@/components/ui/button';
import { ROUTES } from '../../const/routs';

export default function Layouts() {
  const [search, setSearch] = useState('');
  const [layoutToDelete, setLayoutToDelete] = useState<Layout | null>(null);
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['layouts'], queryFn: getLayouts });
  const deleteMutation = useMutation({
    mutationFn: deleteLayout,
    onSuccess: async response => {
      await queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setLayoutToDelete(null);
      toast.success(response.message || 'Layout deleted.');
    },
    onError: mutationError =>
      toast.error(
        mutationError instanceof Error ? mutationError.message : 'Unable to delete layout.',
      ),
  });
  const layouts = data?.data.items ?? [];
  const filteredLayouts = layouts.filter(layout =>
    [layout.layoutCode, layout.name, layout.location ?? '', layout.address ?? '', layout.surveyNumbers ?? ''].some(value =>
      value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
    ),
  );

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Layouts</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Manage land layouts and their price history.
            </p>
          </div>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Search layouts...'
            className='h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm sm:w-64'
          />
          <Button render={<Link to={ROUTES.ADMIN.LAYOUTS_ADD} />}>
            <Plus /> Add Layout
          </Button>
        </div>

        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            Showing {filteredLayouts.length} of {layouts.length} layouts
          </div>
          {isLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading layouts...</p>
          ) : error ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {error instanceof Error ? error.message : 'Failed to load layouts.'}
            </p>
          ) : filteredLayouts.length === 0 ? (
            <p className='p-6 text-sm text-slate-500'>No layouts found.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Code</th>
                    <th className='px-4 py-3'>Layout</th>
                    <th className='px-4 py-3'>Location</th>
                    <th className='px-4 py-3'>Address</th>
                    <th className='px-4 py-3'>Survey numbers</th>
                    <th className='px-4 py-3'>Developers</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3'>Price records</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLayouts.map(layout => (
                    <tr
                      key={layout.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='whitespace-nowrap px-4 py-3 font-medium'>
                        {layout.layoutCode}
                      </td>
                      <td className='px-4 py-3'>{layout.name}</td>
                      <td className='px-4 py-3'>{layout.location || '-'}</td>
                      <td className='max-w-xs px-4 py-3'>{layout.address || '-'}</td>
                      <td className='px-4 py-3'>{layout.surveyNumbers || '-'}</td>
                      <td className='px-4 py-3'>{layout.developerIds.join(', ') || '-'}</td>
                      <td className='px-4 py-3 capitalize'>{layout.status}</td>
                      <td className='px-4 py-3'>{layout.prices.length}</td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            render={<Link to={ROUTES.ADMIN.LAYOUTS_EDIT(layout.id)} />}
                            aria-label={`Edit ${layout.name}`}
                            title='Edit layout'
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete ${layout.name}`}
                            title='Delete layout'
                            onClick={() => setLayoutToDelete(layout)}
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
      {layoutToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-layout-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-layout-title' className='text-lg font-semibold text-slate-900'>
              Delete layout?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              Delete {layoutToDelete.name} and all its price records? This cannot be undone.
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button
                variant='outline'
                disabled={deleteMutation.isPending}
                onClick={() => setLayoutToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant='destructive'
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(layoutToDelete.id)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete layout'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
