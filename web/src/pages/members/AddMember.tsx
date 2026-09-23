import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Upload, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';

import { uploadMembersFile } from '../../api/members';
import { ROUTES } from '../../const/routs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function AddMember() {
  const [activeTab, setActiveTab] = useState<'single' | 'excel'>('single');
  const [excelUploadMessage, setExcelUploadMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [uploadedExcelRows, setUploadedExcelRows] = useState(0);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isSubmittingExcel, setIsSubmittingExcel] = useState(false);

  const [formData, setFormData] = useState({
    memberCode: '',
    memberType: 'MEMBER',
    status: 'ACTIVE',

    name: '',
    nameKannada: '',

    fatherName: '',
    fatherNameKannada: '',

    spouseName: '',
    spouseNameKannada: '',

    careOfName: '',
    careOfNameKannada: '',

    gender: '',
    dob: '',

    mobile: '',
    alternateMobile: '',
    email: '',

    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    postalCode: '',

    addressLine1Kannada: '',
    addressLine2Kannada: '',
    cityKannada: '',
    districtKannada: '',

    aadhaarNumber: '',
    panNumber: '',
    otherId: '',

    joinDate: '',
    membershipDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Member data:', formData);

    // Call your API here
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const isExcelFile =
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      /\.(xlsx|xls|csv)$/i.test(file.name);

    if (!isExcelFile) {
      setSelectedExcelFile(null);
      setExcelUploadMessage({
        type: 'error',
        message: 'Please upload a valid Excel or CSV file.',
      });
      e.target.value = '';
      return;
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        setSelectedExcelFile(null);
        setExcelUploadMessage({
          type: 'error',
          message: 'The uploaded file is empty or does not contain any records.',
        });
        e.target.value = '';
        return;
      }

      setSelectedExcelFile(file);
      setUploadedExcelRows(rows.length);
      setExcelUploadMessage({
        type: 'success',
        message: `${file.name} uploaded successfully. ${rows.length} record(s) read.`,
      });

      console.log('Parsed Excel rows:', rows);
    } catch (error) {
      console.error('Excel parsing failed:', error);
      setSelectedExcelFile(null);
      setExcelUploadMessage({
        type: 'error',
        message: 'Unable to read the selected file. Please check the file format and try again.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExcelSubmit = async () => {
    if (!selectedExcelFile) {
      setExcelUploadMessage({
        type: 'error',
        message: 'Please upload a file before submitting.',
      });
      return;
    }

    setIsSubmittingExcel(true);

    try {
      const response = await uploadMembersFile(selectedExcelFile);

      setExcelUploadMessage({
        type: 'success',
        message: response.message || 'Members file submitted successfully.',
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Unable to submit the file.';

      setExcelUploadMessage({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmittingExcel(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        {/* Header */}
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <UserPlus className='h-6 w-6 text-primary' />

              <h1 className='text-2xl font-semibold text-slate-900'>Add Member</h1>
            </div>

            <p className='mt-1 text-sm text-slate-500'>
              Create a new member or upload multiple members using Excel.
            </p>
          </div>

          <Button variant='outline'>
            <Link to={ROUTES.ADMIN.MEMBERS}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <div className='mb-6 flex w-fit rounded-lg border border-slate-200 bg-white p-1'>
          <button
            type='button'
            onClick={() => setActiveTab('single')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Add Single Member
          </button>

          <button
            type='button'
            onClick={() => setActiveTab('excel')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'excel'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bulk Excel Upload
          </button>
        </div>

        {activeTab === 'single' ? (
          <form onSubmit={handleSubmit}>
            <div className='space-y-6'>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Basic membership information.</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className='grid gap-5 md:grid-cols-3'>
                    <FormField
                      label='Member Code'
                      name='memberCode'
                      value={formData.memberCode}
                      onChange={handleChange}
                      required
                    />

                    <div className='space-y-2'>
                      <Label htmlFor='memberType'>Member Type</Label>

                      <select
                        id='memberType'
                        name='memberType'
                        value={formData.memberType}
                        onChange={handleChange}
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
                        name='status'
                        value={formData.status}
                        onChange={handleChange}
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                      >
                        <option value='ACTIVE'>Active</option>
                        <option value='INACTIVE'>Inactive</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>

                <CardContent className='space-y-6'>
                  <div className='grid gap-5 md:grid-cols-2'>
                    <FormField
                      label='Name'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />

                    <FormField
                      label='Name (Kannada)'
                      name='nameKannada'
                      value={formData.nameKannada}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Father Name'
                      name='fatherName'
                      value={formData.fatherName}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Father Name (Kannada)'
                      name='fatherNameKannada'
                      value={formData.fatherNameKannada}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Spouse Name'
                      name='spouseName'
                      value={formData.spouseName}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Spouse Name (Kannada)'
                      name='spouseNameKannada'
                      value={formData.spouseNameKannada}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Care Of'
                      name='careOfName'
                      value={formData.careOfName}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Care Of (Kannada)'
                      name='careOfNameKannada'
                      value={formData.careOfNameKannada}
                      onChange={handleChange}
                    />
                  </div>

                  <Separator />

                  <div className='grid gap-5 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label htmlFor='gender'>Gender</Label>

                      <select
                        id='gender'
                        name='gender'
                        value={formData.gender}
                        onChange={handleChange}
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                      >
                        <option value=''>Select gender</option>
                        <option value='MALE'>Male</option>
                        <option value='FEMALE'>Female</option>
                        <option value='OTHER'>Other</option>
                      </select>
                    </div>

                    <FormField
                      label='Date of Birth'
                      name='dob'
                      type='date'
                      value={formData.dob}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Join Date'
                      name='joinDate'
                      type='date'
                      value={formData.joinDate}
                      onChange={handleChange}
                    />
                    <FormField
                      label='Membership Date'
                      name='membershipDate'
                      type='date'
                      value={formData.membershipDate}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className='grid gap-5 md:grid-cols-2'>
                    <FormField
                      label='Mobile'
                      name='mobile'
                      value={formData.mobile}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Alternate Mobile'
                      name='alternateMobile'
                      value={formData.alternateMobile}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Email'
                      name='email'
                      type='email'
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Current residential address.</CardDescription>
                </CardHeader>

                <CardContent className='space-y-6'>
                  <div>
                    <h3 className='mb-4 text-sm font-medium text-slate-700'>English</h3>

                    <div className='grid gap-5 md:grid-cols-2'>
                      <FormField
                        label='Address Line 1'
                        name='addressLine1'
                        value={formData.addressLine1}
                        onChange={handleChange}
                      />

                      <FormField
                        label='Address Line 2'
                        name='addressLine2'
                        value={formData.addressLine2}
                        onChange={handleChange}
                      />

                      <FormField
                        label='City'
                        name='city'
                        value={formData.city}
                        onChange={handleChange}
                      />

                      <FormField
                        label='District'
                        name='district'
                        value={formData.district}
                        onChange={handleChange}
                      />

                      <FormField
                        label='Postal Code'
                        name='postalCode'
                        value={formData.postalCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className='mb-4 text-sm font-medium text-slate-700'>Kannada</h3>

                    <div className='grid gap-5 md:grid-cols-2'>
                      <FormField
                        label='Address Line 1 (Kannada)'
                        name='addressLine1Kannada'
                        value={formData.addressLine1Kannada}
                        onChange={handleChange}
                      />

                      <FormField
                        label='Address Line 2 (Kannada)'
                        name='addressLine2Kannada'
                        value={formData.addressLine2Kannada}
                        onChange={handleChange}
                      />

                      <FormField
                        label='City (Kannada)'
                        name='cityKannada'
                        value={formData.cityKannada}
                        onChange={handleChange}
                      />

                      <FormField
                        label='District (Kannada)'
                        name='districtKannada'
                        value={formData.districtKannada}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KYC */}
              <Card>
                <CardHeader>
                  <CardTitle>Identity / KYC</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className='grid gap-5 md:grid-cols-3'>
                    <FormField
                      label='Aadhaar Number'
                      name='aadhaarNumber'
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                    />

                    <FormField
                      label='PAN Number'
                      name='panNumber'
                      value={formData.panNumber}
                      onChange={handleChange}
                    />

                    <FormField
                      label='Other ID'
                      name='otherId'
                      value={formData.otherId}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className='flex justify-end gap-3'>
                <Button variant='outline' type='button'>
                  <Link to={ROUTES.ADMIN.MEMBERS}>Cancel</Link>
                </Button>

                <Button type='submit'>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Create Member
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <BulkExcelUpload
            onUpload={handleExcelUpload}
            onSubmit={handleExcelSubmit}
            excelUploadMessage={excelUploadMessage}
            uploadedExcelRows={uploadedExcelRows}
            hasUploadedFile={Boolean(selectedExcelFile)}
            isSubmitting={isSubmittingExcel}
          />
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Field                                                                 */
/* -------------------------------------------------------------------------- */

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={name}>
        {label}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </Label>

      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Excel Upload                                                               */
/* -------------------------------------------------------------------------- */

function BulkExcelUpload({
  onUpload,
  onSubmit,
  excelUploadMessage,
  uploadedExcelRows,
  hasUploadedFile,
  isSubmitting,
}: {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  excelUploadMessage: { type: 'success' | 'error'; message: string } | null;
  uploadedExcelRows: number;
  hasUploadedFile: boolean;
  isSubmitting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileSpreadsheet className='h-5 w-5 text-primary' />
          Bulk Member Upload
        </CardTitle>

        <CardDescription>Upload an Excel file containing multiple member records.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className='rounded-xl border-2 border-dashed border-slate-200 p-10 text-center'>
          <FileSpreadsheet className='mx-auto h-12 w-12 text-slate-400' />

          <h3 className='mt-4 font-medium text-slate-900'>Upload Excel File</h3>

          <p className='mx-auto mt-2 max-w-md text-sm text-slate-500'>
            Upload your member Excel file. The system will validate the records before creating the
            members.
          </p>

          <div className='mt-6'>
            <label
              htmlFor='member-excel'
              className='inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
            >
              <Upload className='mr-2 h-4 w-4' />
              Select Excel File
            </label>

            <input
              id='member-excel'
              type='file'
              accept='.xlsx,.xls,.csv'
              className='hidden'
              onChange={onUpload}
            />
          </div>

          {excelUploadMessage && (
            <div
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                excelUploadMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {excelUploadMessage.message}
              {excelUploadMessage.type === 'success' && uploadedExcelRows > 0 && (
                <span className='ml-1'>({uploadedExcelRows} rows)</span>
              )}
            </div>
          )}

          {hasUploadedFile && (
            <div className='mt-6 flex justify-center'>
              <Button type='button' onClick={onSubmit} disabled={isSubmitting}>
                <Upload className='mr-2 h-4 w-4' />
                {isSubmitting ? 'Submitting...' : 'Submit Uploaded File'}
              </Button>
            </div>
          )}

          <p className='mt-4 text-xs text-slate-400'>Supported formats: .xlsx, .xls, .csv</p>
        </div>
      </CardContent>
    </Card>
  );
}
