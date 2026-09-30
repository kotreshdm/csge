import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTHER_PARTY_TYPE_VALUE, PARTY_TYPES } from '../../const/common';
import { ROUTES } from '../../const/routs';
import type { PartyPayload } from '../../api/types';

const today = new Date();
const todayDateValue = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');

export type PartyFormValues = {
  name: string;
  partyType: string;
  otherPartyType: string;
  status: string;
  mobile: string;
  address: string;
  details: string;
  startDate: string;
  endDate: string;
};

export const partyFormDefaultValues: PartyFormValues = {
  name: '',
  partyType: '',
  otherPartyType: '',
  status: 'active',
  mobile: '',
  address: '',
  details: '',
  startDate: todayDateValue,
  endDate: '',
};

type PartyFormProps = {
  defaultValues?: Partial<PartyFormValues>;
  onSubmit: (values: PartyPayload) => void | Promise<void>;
  partyTypeOptions?: string[];
  submitLabel?: string;
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; message: string } | null;
  cancelTo?: string;
};

export default function PartyForm({
  defaultValues,
  onSubmit,
  partyTypeOptions = [],
  submitLabel = 'Create Party',
  isSubmitting = false,
  submitMessage,
  cancelTo = ROUTES.ADMIN.PARTIES,
}: PartyFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PartyFormValues>({
    defaultValues: { ...partyFormDefaultValues, ...defaultValues },
  });
  const selectedPartyType = watch('partyType');
  const availablePartyTypes: string[] = [...PARTY_TYPES];

  for (const existingType of partyTypeOptions) {
    if (
      existingType &&
      !availablePartyTypes.some(
        type => type.toLocaleLowerCase() === existingType.toLocaleLowerCase(),
      )
    ) {
      availablePartyTypes.push(existingType);
    }
  }

  const submitForm = handleSubmit(({ otherPartyType, ...values }) =>
    onSubmit({
      ...values,
      partyType:
        values.partyType === OTHER_PARTY_TYPE_VALUE ? otherPartyType.trim() : values.partyType,
    }),
  );

  return (
    <form onSubmit={submitForm} className='space-y-6'>
      {submitMessage && (
        <div
          role='status'
          className={`rounded-md border px-3 py-2 text-sm ${
            submitMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {submitMessage.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Party information</CardTitle>
          <CardDescription>Details and dates for this party.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Party name</Label>
            <Input
              id='name'
              autoComplete='organization'
              aria-invalid={Boolean(errors.name)}
              {...register('name', { required: 'Party name is required.' })}
            />
            {errors.name && <p className='text-sm text-red-600'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='partyType'>Party type</Label>
            <select
              id='partyType'
              aria-invalid={Boolean(errors.partyType)}
              {...register('partyType', { required: 'Party type is required.' })}
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            >
              <option value=''>Select party type</option>
              {availablePartyTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value={OTHER_PARTY_TYPE_VALUE}>Other</option>
            </select>
            {errors.partyType && <p className='text-sm text-red-600'>{errors.partyType.message}</p>}
          </div>

          {selectedPartyType === OTHER_PARTY_TYPE_VALUE && (
            <div className='space-y-2'>
              <Label htmlFor='otherPartyType'>Other party type</Label>
              <Input
                id='otherPartyType'
                aria-invalid={Boolean(errors.otherPartyType)}
                {...register('otherPartyType', {
                  validate: value =>
                    selectedPartyType !== OTHER_PARTY_TYPE_VALUE ||
                    Boolean(value.trim()) ||
                    'Enter the party type.',
                })}
              />
              {errors.otherPartyType && (
                <p className='text-sm text-red-600'>{errors.otherPartyType.message}</p>
              )}
            </div>
          )}

          <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>Status</legend>
            <div className='flex h-10 items-center gap-5'>
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
            </div>
          </fieldset>

          <div className='space-y-2'>
            <Label htmlFor='mobile'>Mobile</Label>
            <Input id='mobile' type='tel' maxLength={10} {...register('mobile')} />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='startDate'>Start date</Label>
            <Input
              id='startDate'
              type='date'
              aria-invalid={Boolean(errors.startDate)}
              {...register('startDate', { required: 'Start date is required.' })}
            />
            {errors.startDate && <p className='text-sm text-red-600'>{errors.startDate.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='endDate'>End date</Label>
            <Input
              id='endDate'
              type='date'
              aria-invalid={Boolean(errors.endDate)}
              {...register('endDate', {
                validate: value =>
                  !value ||
                  !getValues('startDate') ||
                  value >= getValues('startDate') ||
                  'End date must be on or after the start date.',
              })}
            />
            {errors.endDate && <p className='text-sm text-red-600'>{errors.endDate.message}</p>}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='address'>Address</Label>
            <textarea
              id='address'
              rows={3}
              {...register('address')}
              className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='details'>Details</Label>
            <textarea
              id='details'
              rows={4}
              {...register('details')}
              className='flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
            />
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-3'>
        <Link
          to={cancelTo}
          className='inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-muted'
        >
          Cancel
        </Link>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
