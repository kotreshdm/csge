import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createLayoutPrice,
  deleteLayoutPrice,
  getLayout,
  updateLayout,
  updateLayoutPrice,
} from '../../api/layouts';
import type { LayoutPayload, LayoutPrice, LayoutPricePayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import LayoutForm, { type LayoutFormValues } from '../../components/layouts/LayoutForm';
import { ROUTES } from '../../const/routs';

function dateInputValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function priceDraftFrom(price: LayoutPrice) {
  return {
    pricePerSqFt: price.pricePerSqFt,
    validFrom: dateInputValue(price.validFrom),
    validTo: dateInputValue(price.validTo),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function EditLayout() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['layouts', id],
    queryFn: () => getLayout(id),
    enabled: Boolean(id),
  });
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error'; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPrice, setEditingPrice] = useState<LayoutPrice | null>(null);
  const [priceDraft, setPriceDraft] = useState({ pricePerSqFt: '', validFrom: '', validTo: '' });
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState<LayoutPrice | null>(null);
  const layout = data?.data;

  const handleUpdateLayout = async (payload: LayoutPayload) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      await updateLayout(id, payload);
      await queryClient.invalidateQueries({ queryKey: ['layouts'] });
      toast.success('Layout updated.');
    } catch (submitError) {
      setSubmitMessage({
        type: 'error',
        message: errorMessage(submitError, 'Unable to update layout.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginEditPrice = (price: LayoutPrice) => {
    setEditingPrice(price);
    setPriceDraft(priceDraftFrom(price));
  };

  const resetPriceForm = () => {
    setEditingPrice(null);
    setPriceDraft({ pricePerSqFt: '', validFrom: '', validTo: '' });
  };

  const handleSavePrice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingPrice(true);
    const payload: LayoutPricePayload = priceDraft;
    try {
      if (editingPrice) await updateLayoutPrice(id, editingPrice.id, payload);
      else await createLayoutPrice(id, payload);
      await queryClient.invalidateQueries({ queryKey: ['layouts', id] });
      await queryClient.invalidateQueries({ queryKey: ['layouts'] });
      toast.success(editingPrice ? 'Price updated.' : 'Price added.');
      resetPriceForm();
    } catch (priceError) {
      toast.error(errorMessage(priceError, 'Unable to save price.'));
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleDeletePrice = async (price: LayoutPrice) => {
    try {
      await deleteLayoutPrice(id, price.id);
      await queryClient.invalidateQueries({ queryKey: ['layouts', id] });
      await queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setPriceToDelete(null);
      if (editingPrice?.id === price.id) resetPriceForm();
      toast.success('Price deleted.');
    } catch (priceError) {
      toast.error(errorMessage(priceError, 'Unable to delete price.'));
    }
  };

  const defaultValues: Partial<LayoutFormValues> | undefined = layout
    ? {
        layoutCode: layout.layoutCode,
        name: layout.name,
        location: layout.location ?? '',
        address: layout.address ?? '',
        surveyNumbers: layout.surveyNumbers ?? '',
        developerIds: layout.developerIds,
        description: layout.description ?? '',
        otherDetails: layout.otherDetails ?? '',
        status: layout.status,
      }
    : undefined;

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-6 flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Edit Layout</h1>
            <p className='mt-1 text-sm text-slate-500'>
              {layout?.layoutCode ?? 'Update layout details and pricing.'}
            </p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.LAYOUTS} />}>
            <ArrowLeft /> Back
          </Button>
        </div>
        {isLoading ? (
          <p className='p-6 text-sm text-slate-500'>Loading layout...</p>
        ) : error ? (
          <p role='alert' className='p-6 text-sm text-rose-700'>
            {errorMessage(error, 'Failed to load layout.')}
          </p>
        ) : !layout ? (
          <p className='p-6 text-sm text-slate-500'>Layout not found.</p>
        ) : (
          <>
            <LayoutForm
              key={layout.id}
              defaultValues={defaultValues}
              onSubmit={handleUpdateLayout}
              submitLabel='Save Layout'
              isSubmitting={isSubmitting}
              submitMessage={submitMessage}
            />

            <section className='mt-8 rounded-lg border border-slate-200 bg-white p-5'>
              <div className='mb-5'>
                <h2 className='text-lg font-semibold text-slate-900'>Price history</h2>
                <p className='mt-1 text-sm text-slate-500'>
                  Track price per square foot over validity periods.
                </p>
              </div>
              <form
                onSubmit={handleSavePrice}
                className='grid gap-4 border-b border-slate-200 pb-5 md:grid-cols-4 md:items-end'
              >
                <label className='space-y-2 text-sm font-medium text-slate-700'>
                  Price per sq. ft.
                  <input
                    required
                    min='0.01'
                    step='0.01'
                    type='number'
                    value={priceDraft.pricePerSqFt}
                    onChange={event =>
                      setPriceDraft(current => ({ ...current, pricePerSqFt: event.target.value }))
                    }
                    className='h-10 w-full rounded-md border border-slate-200 px-3 font-normal'
                  />
                </label>
                <label className='space-y-2 text-sm font-medium text-slate-700'>
                  Valid from
                  <input
                    required
                    type='date'
                    value={priceDraft.validFrom}
                    onChange={event =>
                      setPriceDraft(current => ({ ...current, validFrom: event.target.value }))
                    }
                    className='h-10 w-full rounded-md border border-slate-200 px-3 font-normal'
                  />
                </label>
                <label className='space-y-2 text-sm font-medium text-slate-700'>
                  Valid to
                  <input
                    type='date'
                    min={priceDraft.validFrom}
                    value={priceDraft.validTo}
                    onChange={event =>
                      setPriceDraft(current => ({ ...current, validTo: event.target.value }))
                    }
                    className='h-10 w-full rounded-md border border-slate-200 px-3 font-normal'
                  />
                </label>
                <div className='flex gap-2'>
                  <Button type='submit' disabled={isSavingPrice}>
                    {isSavingPrice ? 'Saving...' : editingPrice ? 'Update price' : 'Add price'}
                  </Button>
                  {editingPrice && (
                    <Button type='button' variant='outline' onClick={resetPriceForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
              {layout.prices.length === 0 ? (
                <p className='py-6 text-sm text-slate-500'>No price records yet.</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='mt-4 min-w-full text-left text-sm'>
                    <thead className='bg-slate-50 text-slate-600'>
                      <tr>
                        <th className='px-4 py-3'>Price / sq. ft.</th>
                        <th className='px-4 py-3'>Valid from</th>
                        <th className='px-4 py-3'>Valid to</th>
                        <th className='px-4 py-3 text-right'>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layout.prices.map(price => (
                        <tr key={price.id} className='border-t border-slate-100'>
                          <td className='px-4 py-3'>
                            {Number(price.pricePerSqFt).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className='px-4 py-3'>
                            {new Date(price.validFrom).toLocaleDateString('en-GB')}
                          </td>
                          <td className='px-4 py-3'>
                            {price.validTo
                              ? new Date(price.validTo).toLocaleDateString('en-GB')
                              : 'Open-ended'}
                          </td>
                          <td className='px-4 py-3'>
                            <div className='flex justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon-sm'
                                aria-label='Edit price'
                                title='Edit price'
                                onClick={() => beginEditPrice(price)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant='destructive'
                                size='icon-sm'
                                aria-label='Delete price'
                                title='Delete price'
                                onClick={() => setPriceToDelete(price)}
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
          </>
        )}
      </div>
      {priceToDelete && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-price-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-price-title' className='text-lg font-semibold text-slate-900'>
              Delete price record?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              This price record will be permanently removed.
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setPriceToDelete(null)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={() => void handleDeletePrice(priceToDelete)}>
                Delete price
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
