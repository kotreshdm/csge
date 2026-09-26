import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '../../const/routs';
import { updateMember } from '../../api/members';
import MemberForm, {
  memberFormDefaultValues,
  type MemberFormValues,
} from '../../components/members/MemberForm';

export default function EditMember() {
  const { id } = useParams();
  const { state } = useLocation() as { state?: { member?: Record<string, unknown> } };
  const member = state?.member;
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = useMemo<MemberFormValues>(
    () => ({
      ...memberFormDefaultValues,
      memberCode: String(member?.memberCode ?? id ?? ''),
      recieptNo: String(member?.recieptNo ?? ''),
      joinDate: member?.joinDate
        ? new Date(String(member.joinDate)).toISOString().split('T')[0]
        : '',
      memberType: String(member?.memberType ?? 'MEMBER'),
      status: String(member?.status ?? 'ACTIVE'),
      name: String(member?.name ?? ''),
      nameKannada: String(member?.nameKannada ?? ''),
      careOfName: String(member?.careOfName ?? ''),
      careOfNameKannada: String(member?.careOfNameKannada ?? ''),
      mobile: String(member?.mobile ?? ''),
      gender: String(member?.gender ?? ''),
      addressLine1: String(member?.addressLine1 ?? ''),
      addressLine2: String(member?.addressLine2 ?? ''),
      city: String(member?.city ?? ''),
      district: String(member?.district ?? ''),
      addressLine1Kannada: String(member?.addressLine1Kannada ?? ''),
      addressLine2Kannada: String(member?.addressLine2Kannada ?? ''),
      cityKannada: String(member?.cityKannada ?? ''),
      districtKannada: String(member?.districtKannada ?? ''),
      postalCode: String(member?.postalCode ?? ''),
    }),
    [id, member],
  );

  const handleUpdateMember = async (values: MemberFormValues) => {
    setSubmitMessage(null);
    setIsSubmitting(true);

    try {
      const response = await updateMember(String(id ?? ''), values);
      setSubmitMessage({
        type: 'success',
        message: response.message || 'Member updated successfully.',
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

        <MemberForm
          defaultValues={defaultValues}
          onSubmit={handleUpdateMember}
          submitLabel='Update Member'
          isSubmitting={isSubmitting}
          submitMessage={submitMessage}
          cancelTo={ROUTES.ADMIN.MEMBERS}
        />
      </div>
    </main>
  );
}
