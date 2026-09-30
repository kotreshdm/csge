import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Map } from 'lucide-react';

import { createLayout } from '../../api/layouts';
import type { LayoutPayload } from '../../api/types';
import { Button } from '@/components/ui/button';
import LayoutForm from '../../components/layouts/LayoutForm';
import { ROUTES } from '../../const/routs';

export default function AddLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitMessage, setSubmitMessage] = useState<{ type: 'error'; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (payload: LayoutPayload) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const response = await createLayout(payload);
      await queryClient.invalidateQueries({ queryKey: ['layouts'] });
      navigate(ROUTES.ADMIN.LAYOUTS, { state: { message: response.message || 'Layout created.' } });
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to create layout.',
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
              <Map className='size-6 text-primary' />
              <h1 className='text-2xl font-semibold text-slate-900'>Add Layout</h1>
            </div>
            <p className='mt-1 text-sm text-slate-500'>Create a layout record.</p>
          </div>
          <Button variant='outline' render={<Link to={ROUTES.ADMIN.LAYOUTS} />}>
            <ArrowLeft /> Back
          </Button>
        </div>
        <LayoutForm
          onSubmit={handleSubmit}
          submitLabel='Create Layout'
          isSubmitting={isSubmitting}
          submitMessage={submitMessage}
        />
      </div>
    </main>
  );
}
