import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { getAccount, updateAccount } from '../../api/accounts';
import type { AccountPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import AccountForm from '../../components/accounts/AccountForm';
import { ROUTES } from '../../const/routs';

export default function EditAccount() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts', id],
    queryFn: () => getAccount(id),
    enabled: Boolean(id),
  });
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error'; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const account = data?.data;

  const handleSubmit = async (payload: AccountPayload) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await updateAccount(id, payload);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate(ROUTES.ADMIN.ACCOUNTS, {
        state: { message: response.message || 'Account updated.' },
      });
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to update account.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-5xl'>
        <div className='mb-6 flex items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Edit Account</h1>
            <p className='mt-1 text-sm text-slate-500'>
              {account?.accountCode ?? 'Update account details.'}
            </p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.ACCOUNTS} />}>
            <ArrowLeft /> Back
          </Button>
        </div>
        {isLoading ? (
          <p className='p-6 text-sm text-slate-500'>Loading account...</p>
        ) : error ? (
          <p role='alert' className='p-6 text-sm text-rose-700'>
            {error instanceof Error ? error.message : 'Failed to load account.'}
          </p>
        ) : !account ? (
          <p className='p-6 text-sm text-slate-500'>Account not found.</p>
        ) : (
          <AccountForm
            key={account.id}
            defaultValues={{
              accountCode: account.accountCode,
              name: account.name,
              accountType: account.accountType,
              accountNumber: account.accountNumber ?? '',
              bankName: account.bankName ?? '',
              openingBalance: account.openingBalance,
              isActive: account.isActive,
            }}
            onSubmit={handleSubmit}
            submitLabel='Save Account'
            isSubmitting={isSubmitting}
            submitMessage={submitMessage}
          />
        )}
      </div>
    </main>
  );
}
