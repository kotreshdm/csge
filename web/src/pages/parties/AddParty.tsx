import { useState } from 'react';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createParty, getPartyTypes } from '../../api/parties';
import type { PartyPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import PartyForm, { partyFormDefaultValues } from '../../components/parties/PartyForm';
import { ROUTES } from '../../const/routs';

export default function AddParty() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: partyTypeOptions = [] } = useQuery({
    queryKey: ['partyTypes'],
    queryFn: getPartyTypes,
    staleTime: 30_000,
  });
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateParty = async (values: PartyPayload) => {
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const response = await createParty(values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parties'] }),
        queryClient.invalidateQueries({ queryKey: ['partyTypes'] }),
      ]);
      navigate(ROUTES.ADMIN.PARTIES, {
        state: { message: response.message || 'Party created successfully.' },
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Unable to create party.';

      setSubmitMessage({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-6 flex items-center justify-between gap-4'>
          <div>
            <div className='flex items-center gap-3'>
              <UsersRound className='h-6 w-6 text-primary' />
              <h1 className='text-2xl font-semibold text-slate-900'>Add Party</h1>
            </div>
            <p className='mt-1 text-sm text-slate-500'>Create a party record.</p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.PARTIES} />}>
            <ArrowLeft />
            Back
          </Button>
        </div>

        <PartyForm
          defaultValues={partyFormDefaultValues}
          partyTypeOptions={partyTypeOptions}
          onSubmit={handleCreateParty}
          submitLabel='Create Party'
          isSubmitting={isSubmitting}
          submitMessage={submitMessage}
          cancelTo={ROUTES.ADMIN.PARTIES}
        />
      </div>
    </main>
  );
}
