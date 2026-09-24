import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '../../const/routs';
import MemberForm, {
  memberFormDefaultValues,
  type MemberFormValues,
} from '../../components/members/MemberForm';

export default function EditMember() {
  const { id } = useParams();
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateMember = async (values: MemberFormValues) => {
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      console.log('Update member payload', { id, ...values });
      setSubmitMessage({
        type: 'success',
        message: 'Member updated successfully.',
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Unable to update member.';

      setSubmitMessage({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-slate-900'>Edit Member</h1>
            <p className='mt-1 text-sm text-slate-500'>Update member information.</p>
          </div>

          <Link
            to={ROUTES.ADMIN.MEMBERS}
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </div>

        <div className='rounded-xl border border-slate-200 bg-white p-6'>
          <p className='mb-4 text-sm text-slate-500'>Editing member: {id}</p>

          <MemberForm
            defaultValues={{
              ...memberFormDefaultValues,
              memberCode: id ?? '',
            }}
            onSubmit={handleUpdateMember}
            submitLabel='Update Member'
            isSubmitting={isSubmitting}
            submitMessage={submitMessage}
            cancelTo={ROUTES.ADMIN.MEMBERS}
          />
        </div>
      </div>
    </main>
  );
}
