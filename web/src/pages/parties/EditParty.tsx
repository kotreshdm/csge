import { useMemo, useState } from 'react';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getParties, getPartyTypes, updateParty } from '../../api/parties';
import type { PartyPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import PartyForm, {
  partyFormDefaultValues,
  type PartyFormValues,
} from '../../components/parties/PartyForm';
import { ROUTES } from '../../const/routs';

function dateInputValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function EditParty() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['parties'],
    queryFn: getParties,
    staleTime: 30_000,
  });
  const { data: partyTypeOptions = [] } = useQuery({
    queryKey: ['partyTypes'],
    queryFn: getPartyTypes,
    staleTime: 30_000,
  });
  const party = data?.data.items.find(item => item.id === id);
  const defaultValues = useMemo<PartyFormValues>(
    () =>
      party
        ? {
            name: party.name,
            partyType: party.partyType,
            otherPartyType: '',
            status: party.status,
            mobile: party.mobile ?? '',
            address: party.address ?? '',
            details: party.details ?? '',
            startDate: dateInputValue(party.startDate),
            endDate: dateInputValue(party.endDate),
          }
        : partyFormDefaultValues,
    [party],
  );
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateParty = async (values: PartyPayload) => {
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const response = await updateParty(id, values);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['parties'] }),
        queryClient.invalidateQueries({ queryKey: ['partyTypes'] }),
      ]);
      navigate(ROUTES.ADMIN.PARTIES, {
        state: { message: response.message || 'Party updated successfully.' },
      });
    } catch (submitError) {
      const message =
        submitError && typeof submitError === 'object' && 'message' in submitError
          ? String((submitError as { message?: string }).message)
          : 'Unable to update party.';

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
              <h1 className='text-2xl font-semibold text-slate-900'>Edit Party</h1>
            </div>
            <p className='mt-1 text-sm text-slate-500'>Update party information.</p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.PARTIES} />}>
            <ArrowLeft />
            Back
          </Button>
        </div>

        {isLoading ? (
          <div className='p-6 text-sm text-slate-500'>Loading party...</div>
        ) : error ? (
          <div role='alert' className='p-6 text-sm text-rose-700'>
            {error instanceof Error ? error.message : 'Failed to load party.'}
          </div>
        ) : !party ? (
          <div className='p-6 text-sm text-slate-500'>Party not found.</div>
        ) : (
          <PartyForm
            key={party.id}
            defaultValues={defaultValues}
            partyTypeOptions={partyTypeOptions}
            onSubmit={handleUpdateParty}
            submitLabel='Update Party'
            isSubmitting={isSubmitting}
            submitMessage={submitMessage}
            cancelTo={ROUTES.ADMIN.PARTIES}
          />
        )}
      </div>
    </main>
  );
}
