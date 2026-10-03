import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccountPayload } from '../../api/types';
import { ROUTES } from '../../const/routs';

export type AccountFormValues = AccountPayload;

export const accountFormDefaultValues: AccountFormValues = {
  accountCode: '',
  name: '',
  accountType: '',
  accountNumber: '',
  bankName: '',
  openingBalance: '0.00',
  isActive: true,
};

type AccountFormProps = {
  defaultValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountPayload) => void | Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitMessage?: { type: 'error'; message: string } | null;
};

export default function AccountForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitMessage,
}: AccountFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    defaultValues: { ...accountFormDefaultValues, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
      {submitMessage && (
        <p role='alert' className='rounded-md bg-rose-50 p-3 text-sm text-rose-700'>
          {submitMessage.message}
        </p>
      )}
      <section className='rounded-lg border border-slate-200 bg-white p-5'>
        <h2 className='mb-5 text-base font-semibold text-slate-900'>Account details</h2>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='accountCode'>Account code</Label>
            <Input
              id='accountCode'
              aria-invalid={Boolean(errors.accountCode)}
              {...register('accountCode', { required: 'Account code is required.' })}
            />
            {errors.accountCode && (
              <p className='text-sm text-rose-700'>{errors.accountCode.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='name'>Account name</Label>
            <Input
              id='name'
              aria-invalid={Boolean(errors.name)}
              {...register('name', { required: 'Account name is required.' })}
            />
            {errors.name && <p className='text-sm text-rose-700'>{errors.name.message}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='accountType'>Account type</Label>
            <Input
              id='accountType'
              placeholder='e.g. Bank, Cash'
              aria-invalid={Boolean(errors.accountType)}
              {...register('accountType', { required: 'Account type is required.' })}
            />
            {errors.accountType && (
              <p className='text-sm text-rose-700'>{errors.accountType.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='openingBalance'>Opening balance</Label>
            <Input
              id='openingBalance'
              type='number'
              step='1'
              max='9999999999999.99'
              min='0'
              aria-invalid={Boolean(errors.openingBalance)}
              {...register('openingBalance', {
                required: 'Opening balance is required.',
                validate: value => Number.isFinite(Number(value)) || 'Enter a valid amount.',
              })}
            />
            {errors.openingBalance && (
              <p className='text-sm text-rose-700'>{errors.openingBalance.message}</p>
            )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='bankName'>Bank name</Label>
            <Input id='bankName' {...register('bankName')} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='accountNumber'>Account number</Label>
            <Input id='accountNumber' {...register('accountNumber')} />
          </div>
          <Controller
            control={control}
            name='isActive'
            render={({ field }) => (
              <fieldset className='space-y-2'>
                <legend className='text-sm font-medium'>Status</legend>
                <div className='flex h-10 items-center gap-5'>
                  <label className='inline-flex items-center gap-2 text-sm'>
                    <input
                      type='radio'
                      name={field.name}
                      checked={field.value}
                      onChange={() => field.onChange(true)}
                      className='size-4 accent-primary'
                    />
                    Active
                  </label>
                  <label className='inline-flex items-center gap-2 text-sm'>
                    <input
                      type='radio'
                      name={field.name}
                      checked={!field.value}
                      onChange={() => field.onChange(false)}
                      className='size-4 accent-primary'
                    />
                    Inactive
                  </label>
                </div>
              </fieldset>
            )}
          />
        </div>
      </section>
      <div className='flex justify-end gap-3'>
        <Button variant='outline' render={<Link to={ROUTES.ADMIN.ACCOUNTS} />}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
