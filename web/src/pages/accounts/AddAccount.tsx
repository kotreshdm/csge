import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Landmark } from 'lucide-react';

import { createAccount } from '../../api/accounts';
import type { AccountPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import AccountForm from '../../components/accounts/AccountForm';
import { ROUTES } from '../../const/routs';

export default function AddAccount() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error'; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: AccountPayload) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await createAccount(payload);
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate(ROUTES.ADMIN.ACCOUNTS, {
        state: { message: response.message || 'Account created.' },
      });
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to create account.',
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
            <div className='flex items-center gap-3'>
              <Landmark className='size-6 text-primary' />
              <h1 className='text-2xl font-semibold text-slate-900'>Add Account</h1>
            </div>
            <p className='mt-1 text-sm text-slate-500'>Create a bank or cash account.</p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.ACCOUNTS} />}>
            <ArrowLeft /> Back
          </Button>
        </div>
        <AccountForm
          onSubmit={handleSubmit}
          submitLabel='Create Account'
          isSubmitting={isSubmitting}
          submitMessage={submitMessage}
        />
      </div>
    </main>
  );
}
