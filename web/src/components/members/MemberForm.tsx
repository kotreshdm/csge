import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useForm, type UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ROUTES } from '../../const/routs';

export type MemberFormValues = {
  memberCode: string;
  recieptNo: string;
  joinDate: string;
  memberType: string;
  status: string;
  name: string;
  nameKannada: string;
  careOfName: string;
  careOfNameKannada: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  gender: string;
  dob: string;
  fatherName: string;
  fatherNameKannada: string;
  spouseName: string;
  spouseNameKannada: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  addressLine1Kannada: string;
  addressLine2Kannada: string;
  cityKannada: string;
  districtKannada: string;
  postalCode: string;
  aadhaarNumber: string;
  panNumber: string;
  otherId: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeMobile: string;
  nomineeEmail: string;
  nomineeAddress: string;
  nomineeDateOfBirth: string;
  occupation: string;
  permanentAddress: string;
  officeAddress: string;
  remarks: string;
};

export const memberFormDefaultValues: MemberFormValues = {
  memberCode: '',
  recieptNo: '',
  joinDate: '',
  memberType: 'MEMBER',
  status: 'ACTIVE',
  name: '',
  nameKannada: '',
  careOfName: '',
  careOfNameKannada: '',
  mobile: '',
  alternateMobile: '',
  email: '',
  gender: '',
  dob: '',
  fatherName: '',
  fatherNameKannada: '',
  spouseName: '',
  spouseNameKannada: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  district: '',
  addressLine1Kannada: '',
  addressLine2Kannada: '',
  cityKannada: '',
  districtKannada: '',
  postalCode: '',
  aadhaarNumber: '',
  panNumber: '',
  otherId: '',
  nomineeName: '',
  nomineeRelation: '',
  nomineeMobile: '',
  nomineeEmail: '',
  nomineeAddress: '',
  nomineeDateOfBirth: '',
  occupation: '',
  permanentAddress: '',
  officeAddress: '',
  remarks: '',
};

type MemberFormProps = {
  defaultValues?: Partial<MemberFormValues>;
  onSubmit: (values: MemberFormValues) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitMessage?: { type: 'success' | 'error'; message: string } | null;
  cancelTo?: string;
};

export default function MemberForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Create Member',
  isSubmitting = false,
  submitMessage,
  cancelTo = ROUTES.ADMIN.MEMBERS,
}: MemberFormProps) {
  const { register, handleSubmit } = useForm<MemberFormValues>({
    defaultValues: {
      ...memberFormDefaultValues,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {submitMessage && (
        <div
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
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core membership details.</CardDescription>
        </CardHeader>

        <CardContent>
          <div className='grid gap-5 md:grid-cols-3'>
            <FormField
              label='Member Code'
              name='memberCode'
              required
              register={register}
              maxLength={8}
            />
            <FormField
              label='Receipt No'
              name='recieptNo'
              required
              register={register}
              maxLength={8}
            />
            <FormField label='Join Date' name='joinDate' type='date' required register={register} />

            <div className='space-y-2'>
              <Label htmlFor='memberType'>Member Type</Label>
              <select
                id='memberType'
                {...register('memberType')}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                <option value='MEMBER'>Member</option>
                <option value='ASSOCIATE'>Associate</option>
                <option value='SUPERUSER'>Superuser</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <select
                id='status'
                {...register('status')}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                <option value='ACTIVE'>Active</option>
                <option value='INACTIVE'>Inactive</option>
                <option value='INCORRECT'>Incorrect</option>
                <option value='RESIGNED'>Resigned</option>
                <option value='DECEASED'>Deceased</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div className='grid gap-5 md:grid-cols-2'>
            <FormField label='Name' name='name' required register={register} />
            <FormField label='Name (Kannada)' name='nameKannada' required register={register} />
            <FormField label='Father Name' name='fatherName' register={register} />
            <FormField label='Father Name (Kannada)' name='fatherNameKannada' register={register} />
            <FormField label='Spouse Name' name='spouseName' register={register} />
            <FormField label='Spouse Name (Kannada)' name='spouseNameKannada' register={register} />
            <FormField label='Care Of' name='careOfName' register={register} />
            <FormField label='Care Of (Kannada)' name='careOfNameKannada' register={register} />

            <div className='space-y-2'>
              <Label htmlFor='gender'>Gender</Label>
              <select
                id='gender'
                {...register('gender')}
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              >
                <option value=''>Select gender</option>
                <option value='MALE'>Male</option>
                <option value='FEMALE'>Female</option>
                <option value='OTHER'>Other</option>
              </select>
            </div>

            <FormField label='Date of Birth' name='dob' type='date' register={register} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact & KYC</CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid gap-5 md:grid-cols-2'>
            <FormField label='Mobile' name='mobile' required register={register} maxLength={10} />
            <FormField
              label='Alternate Mobile'
              name='alternateMobile'
              register={register}
              maxLength={10}
            />
            <FormField label='Email' name='email' type='email' register={register} />
            <FormField label='Occupation' name='occupation' register={register} />
            <FormField
              label='Aadhaar Number'
              name='aadhaarNumber'
              register={register}
              maxLength={16}
            />
            <FormField label='PAN Number' name='panNumber' register={register} maxLength={11} />
            <FormField label='Other ID' name='otherId' register={register} />
            <FormField
              label='Postal Code'
              name='postalCode'
              required
              register={register}
              maxLength={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Residential and office address details.</CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          <div>
            <h3 className='mb-4 text-sm font-medium text-slate-700'>English</h3>
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField label='Address Line 1' name='addressLine1' required register={register} />
              <FormField label='Address Line 2' name='addressLine2' required register={register} />
              <FormField label='City' name='city' required register={register} />
              <FormField label='District' name='district' required register={register} />
              <FormField label='Permanent Address' name='permanentAddress' register={register} />
              <FormField label='Office Address' name='officeAddress' register={register} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className='mb-4 text-sm font-medium text-slate-700'>Kannada</h3>
            <div className='grid gap-5 md:grid-cols-2'>
              <FormField
                label='Address Line 1 (Kannada)'
                name='addressLine1Kannada'
                register={register}
              />
              <FormField
                label='Address Line 2 (Kannada)'
                name='addressLine2Kannada'
                register={register}
              />
              <FormField label='City (Kannada)' name='cityKannada' register={register} />
              <FormField label='District (Kannada)' name='districtKannada' register={register} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nominee Details</CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid gap-5 md:grid-cols-2'>
            <FormField label='Nominee Name' name='nomineeName' register={register} />
            <FormField label='Nominee Relation' name='nomineeRelation' register={register} />
            <FormField label='Nominee Mobile' name='nomineeMobile' register={register} />
            <FormField label='Nominee Email' name='nomineeEmail' register={register} />
            <FormField
              label='Nominee Date of Birth'
              name='nomineeDateOfBirth'
              type='date'
              register={register}
            />
            <FormField label='Nominee Address' name='nomineeAddress' register={register} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className='space-y-2'>
            <Label htmlFor='remarks'>Remarks</Label>
            <Input id='remarks' {...register('remarks')} />
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-3'>
        {cancelTo && (
          <Link
            to={cancelTo}
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Cancel
          </Link>
        )}

        <Button type='submit' disabled={isSubmitting}>
          <UserPlus className='mr-2 h-4 w-4' />
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  required = false,
  register,
  maxLength,
}: {
  label: string;
  name: keyof MemberFormValues;
  type?: string;
  required?: boolean;
  register: UseFormRegister<MemberFormValues>;
  maxLength?: number;
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={name}>
        {label}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </Label>

      <Input
        id={name}
        type={type}
        {...register(name, {
          required,
          maxLength: maxLength
            ? { value: maxLength, message: `Maximum ${maxLength} characters allowed.` }
            : undefined,
        })}
        required={required}
        maxLength={maxLength}
      />
    </div>
  );
}
