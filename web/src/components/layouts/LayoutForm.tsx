import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getParties } from '../../api/parties';
import type { LayoutPayload } from '../../api/types';
import { ROUTES } from '../../const/routs';

export type LayoutFormValues = Omit<LayoutPayload, 'developerIds'> & { developerIds: string[] };

export const layoutFormDefaultValues: LayoutFormValues = {
  layoutCode: '',
  name: '',
  location: '',
  address: '',
  surveyNumbers: '',
  developerIds: [],
  description: '',
  otherDetails: '',
  status: 'active',
};

type LayoutFormProps = {
  defaultValues?: Partial<LayoutFormValues>;
  onSubmit: (payload: LayoutPayload) => void | Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitMessage?: { type: 'error'; message: string } | null;
};

export default function LayoutForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitMessage,
}: LayoutFormProps) {
  const [developerMenuOpen, setDeveloperMenuOpen] = useState(false);
  const [developerSearch, setDeveloperSearch] = useState('');
  const { data: partiesResponse, isLoading: arePartiesLoading, error: partiesError } = useQuery({
    queryKey: ['parties'],
    queryFn: getParties,
    staleTime: 30_000,
  });
  const parties = partiesResponse?.data.items ?? [];
  const developers = parties.filter(party => party.partyType.trim().toLocaleLowerCase() === 'developer');
  const availableDevelopers = developers.filter(party =>
    `${party.name} ${party.partyType}`
      .toLocaleLowerCase()
      .includes(developerSearch.trim().toLocaleLowerCase()),
  );
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LayoutFormValues>({
    defaultValues: { ...layoutFormDefaultValues, ...defaultValues },
  });

  const submit = handleSubmit(values => onSubmit(values));

  return (
    <form onSubmit={submit} className='space-y-5'>
      {submitMessage && (
        <p role='alert' className='rounded-md bg-rose-50 p-3 text-sm text-rose-700'>
          {submitMessage.message}
        </p>
      )}
      <section className='rounded-lg border border-slate-200 bg-white p-5'>
        <h2 className='mb-5 text-base font-semibold text-slate-900'>Layout details</h2>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='layoutCode'>Layout code</Label>
            <Input
              id='layoutCode'
              aria-invalid={Boolean(errors.layoutCode)}
              {...register('layoutCode', { required: 'Layout code is required.' })}
            />
            {errors.layoutCode && (
              <p className='text-sm text-rose-700'>{errors.layoutCode.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='name'>Layout name</Label>
            <Input
              id='name'
              aria-invalid={Boolean(errors.name)}
              {...register('name', { required: 'Layout name is required.' })}
            />
            {errors.name && <p className='text-sm text-rose-700'>{errors.name.message}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='location'>Location</Label>
            <Input id='location' {...register('location')} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='surveyNumbers'>Survey numbers (Sy. No.)</Label>
            <Input id='surveyNumbers' {...register('surveyNumbers')} />
          </div>
          <div className='space-y-2'>
            <Label>Status</Label>
            <fieldset className='flex h-10 items-center gap-5' aria-label='Layout status'>
              {(['active', 'inactive'] as const).map(status => (
                <label key={status} className='inline-flex items-center gap-2 text-sm capitalize'>
                  <input
                    type='radio'
                    value={status}
                    {...register('status', { required: 'Status is required.' })}
                    className='size-4 accent-primary'
                  />
                  {status}
                </label>
              ))}
            </fieldset>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='developerIds'>Developers</Label>
            <Controller
              control={control}
              name='developerIds'
              render={({ field }) => {
                const selectedParties = developers.filter(party => field.value.includes(party.id));

                return (
                  <div className='relative'>
                    <Button
                      id='developerIds'
                      type='button'
                      variant='outline'
                      aria-haspopup='listbox'
                      aria-expanded={developerMenuOpen}
                      className='w-full justify-between font-normal'
                      onClick={() => setDeveloperMenuOpen(open => !open)}
                    >
                      <span className='truncate text-left'>
                        {selectedParties.length
                          ? selectedParties.map(party => party.name).join(', ')
                          : 'Select developers'}
                      </span>
                      <ChevronsUpDown aria-hidden='true' />
                    </Button>
                    {developerMenuOpen && (
                      <div className='absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white p-2 shadow-lg'>
                        <Input
                          autoFocus
                          value={developerSearch}
                          onChange={event => setDeveloperSearch(event.target.value)}
                          placeholder='Search developers...'
                          aria-label='Search developers'
                        />
                        {arePartiesLoading ? (
                          <p className='p-3 text-sm text-slate-500'>Loading parties...</p>
                        ) : partiesError ? (
                          <p role='alert' className='p-3 text-sm text-rose-700'>Unable to load parties.</p>
                        ) : availableDevelopers.length === 0 ? (
                          <p className='p-3 text-sm text-slate-500'>No developers found.</p>
                        ) : (
                          <div role='listbox' aria-multiselectable='true' className='mt-2 max-h-56 overflow-y-auto'>
                            {availableDevelopers.map(party => {
                              const isSelected = field.value.includes(party.id);
                              return (
                                <button
                                  key={party.id}
                                  type='button'
                                  role='option'
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    field.onChange(
                                      isSelected
                                        ? field.value.filter(id => id !== party.id)
                                        : [...field.value, party.id],
                                    );
                                  }}
                                  className='flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-slate-100'
                                >
                                  <span className={`flex size-4 items-center justify-center rounded-sm border ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-slate-300'}`}>
                                    {isSelected && <Check className='size-3' aria-hidden='true' />}
                                  </span>
                                  <span className='min-w-0 flex-1'>
                                    <span className='block truncate text-sm font-medium text-slate-900'>{party.name}</span>
                                    <span className='block truncate text-xs text-slate-500'>{party.partyType}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <div className='mt-2 flex justify-between border-t border-slate-100 pt-2'>
                          <span className='px-2 py-1 text-xs text-slate-500'>{selectedParties.length} selected</span>
                          <Button type='button' size='sm' variant='ghost' onClick={() => setDeveloperMenuOpen(false)}>Done</Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='address'>Address</Label>
            <textarea
              id='address'
              rows={3}
              {...register('address')}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='description'>Description</Label>
            <textarea
              id='description'
              rows={3}
              {...register('description')}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='otherDetails'>Other details</Label>
            <textarea
              id='otherDetails'
              rows={3}
              {...register('otherDetails')}
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            />
          </div>
        </div>
      </section>
      <div className='flex justify-end gap-3'>
        <Button variant='outline' render={<Link to={ROUTES.ADMIN.LAYOUTS} />}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
